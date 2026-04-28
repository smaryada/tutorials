/**
 * 834 EDI generator. Builds an ASC X12 005010X220A1 Benefit Enrollment
 * and Maintenance transaction from a scenario + form data object.
 *
 * Uses standard delimiters:
 *   element separator: *
 *   sub-element:       :
 *   segment terminator: ~ (followed by \n in pretty output)
 *   repetition:        ^
 */
(function () {
  const ELEMENT_SEP = "*";
  const SUB_SEP = ":";
  const SEG_TERM = "~";
  const REP_SEP = "^";

  const SEGMENT_DESCRIPTIONS = {
    ISA: "Interchange Control Header",
    GS:  "Functional Group Header",
    ST:  "Transaction Set Header (834)",
    BGN: "Beginning Segment",
    REF: "Reference Identification",
    DTP: "Date / Time / Period",
    QTY: "Quantity",
    N1:  "Name",
    N3:  "Address Information",
    N4:  "Geographic Location",
    INS: "Member Level Detail",
    NM1: "Individual or Organizational Name",
    PER: "Administrative Communications Contact",
    DMG: "Demographic Information",
    HD:  "Health Coverage",
    AMT: "Monetary Amount",
    LX:  "Loop Header",
    SE:  "Transaction Set Trailer",
    GE:  "Functional Group Trailer",
    IEA: "Interchange Control Trailer"
  };

  /** Pad/truncate a string to length n, padding right with spaces. */
  function pad(value, len) {
    const s = String(value || "");
    if (s.length >= len) return s.substring(0, len);
    return s + " ".repeat(len - s.length);
  }

  /** Format a Date as YYMMDD or YYYYMMDD. */
  function formatDate(date, longYear = false) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return longYear ? `${yyyy}${mm}${dd}` : `${String(yyyy).slice(-2)}${mm}${dd}`;
  }

  /** Format a Date as HHMM. */
  function formatTime(date) {
    return String(date.getHours()).padStart(2, "0") + String(date.getMinutes()).padStart(2, "0");
  }

  /** Convert YYYY-MM-DD form input to CCYYMMDD (834 standard). */
  function isoToEdiDate(iso) {
    if (!iso) return "";
    return iso.replace(/-/g, "");
  }

  /** Strip non-alphanumeric chars from an ID-style field. */
  function clean(s) {
    return String(s || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  }

  /** Make a segment from an array of elements. Empty trailing elements are trimmed. */
  function segment(...elements) {
    while (elements.length && (elements[elements.length - 1] === "" || elements[elements.length - 1] == null)) {
      elements.pop();
    }
    return elements.map(e => e == null ? "" : String(e)).join(ELEMENT_SEP) + SEG_TERM;
  }

  /**
   * Build an INS member loop (subscriber or dependent).
   * Returns an array of segment strings.
   */
  function buildMemberLoop(member, scenario, ctx, isSubscriber) {
    const segs = [];
    const ins01 = isSubscriber ? "Y" : "N";
    const ins02 = isSubscriber ? "18" : (member.relationship || scenario.ins02 || "19");

    // INS — Member Level Detail
    segs.push(segment(
      "INS",
      ins01,
      ins02,
      scenario.ins03,
      scenario.ins04,
      scenario.ins05 || "A",
      "", // INS06 Medicare Plan Code
      "", // INS07 Consolidated Omnibus Budget Reconciliation Act
      scenario.ins08 || "AC"
    ));

    // REF*0F — Subscriber identifier
    segs.push(segment("REF", "0F", clean(member.subscriberId)));

    // REF*1L — Member Group Policy Number (subscriber only)
    if (isSubscriber && ctx.groupNumber) {
      segs.push(segment("REF", "1L", clean(ctx.groupNumber)));
    }

    // REF*23 — Client Number (member-level identifier when dependent has its own)
    if (!isSubscriber && member.depSsn) {
      segs.push(segment("REF", "23", clean(member.depSsn)));
    }

    // 2000-loop date qualifiers (DTP) per scenario
    if (scenario.dateQualifiers && scenario.dateQualifiers.length) {
      for (const dq of scenario.dateQualifiers) {
        const isoDate = ctx[dq.source] || ctx.effectiveDate;
        if (isoDate) {
          segs.push(segment("DTP", dq.qualifier, "D8", isoToEdiDate(isoDate)));
        }
      }
    }

    // NM1 — Member Name
    if (isSubscriber) {
      segs.push(segment(
        "NM1", "IL", "1",
        (member.lastName || "").toUpperCase(),
        (member.firstName || "").toUpperCase(),
        (member.middleName || "").toUpperCase(),
        "", "",
        "34", clean(member.ssn || member.subscriberId)
      ));
    } else {
      segs.push(segment(
        "NM1", "74", "1",
        (member.depLastName || "").toUpperCase(),
        (member.depFirstName || "").toUpperCase(),
        "", "", "",
        "34", clean(member.depSsn || "")
      ));
    }

    // PER — Communications (subscriber only, when phone/email provided)
    if (isSubscriber && (member.phone || member.email)) {
      const elements = ["PER", "IP", "", ];
      if (member.phone) {
        elements.push("TE", clean(member.phone));
      }
      if (member.email) {
        elements.push("EM", member.email);
      }
      segs.push(segment(...elements));
    }

    // N3 / N4 — Address (subscriber only)
    if (isSubscriber && member.addressLine1) {
      const n3Args = ["N3", member.addressLine1.toUpperCase()];
      if (member.addressLine2) n3Args.push(member.addressLine2.toUpperCase());
      segs.push(segment(...n3Args));
      segs.push(segment(
        "N4",
        (member.city || "").toUpperCase(),
        (member.state || "").toUpperCase(),
        clean(member.zip),
        "USA"
      ));
    }

    // DMG — Demographics
    const dob = isSubscriber ? member.dateOfBirth : member.depDateOfBirth;
    const gender = isSubscriber ? member.gender : member.depGender;
    if (dob) {
      const dmg = ["DMG", "D8", isoToEdiDate(dob), gender || "U"];
      if (isSubscriber && member.maritalStatus) {
        dmg.push(member.maritalStatus);
      }
      segs.push(segment(...dmg));
    }

    // HD — Health Coverage (one per coverage line)
    // Maintenance type code in HD01: 021/024/025/030/001
    segs.push(segment(
      "HD",
      scenario.ins03,
      "",
      ctx.insuranceLineCode || "HLT",
      ctx.planDescription || "",
      ctx.coverageLevel || "EMP"
    ));

    // DTP*348 — Benefit Begin
    if (ctx.effectiveDate) {
      segs.push(segment("DTP", "348", "D8", isoToEdiDate(ctx.effectiveDate)));
    }
    // DTP*349 — Benefit End (only if scenario terms or end date provided)
    if (ctx.endDate && (scenario.ins03 === "024" || scenario.ins03 === "001")) {
      segs.push(segment("DTP", "349", "D8", isoToEdiDate(ctx.endDate)));
    }

    // AMT — Premium Amount (subscriber only)
    if (isSubscriber && ctx.premiumAmount && Number(ctx.premiumAmount) > 0) {
      segs.push(segment("AMT", "P3", Number(ctx.premiumAmount).toFixed(2)));
    }

    return segs;
  }

  /**
   * Build the entire 834 transaction from form context + scenario.
   * Returns: { ediString, segments: [{id, content, raw, description}, ...] }
   */
  function generate(scenario, ctx) {
    if (!scenario) throw new Error("Scenario is required");
    const now = new Date();
    const dateLong = formatDate(now, true);
    const dateShort = formatDate(now, false);
    const time = formatTime(now);

    const isaCtl = clean(ctx.controlNumber || "1").padStart(9, "0").slice(-9);
    const gsCtl = String(parseInt(isaCtl, 10) || 1);
    const stCtl = "0001";

    const senderId = pad(clean(ctx.senderId || "SENDER"), 15);
    const receiverId = pad(clean(ctx.receiverId || "RECEIVER"), 15);

    const lines = [];

    // ISA
    lines.push([
      "ISA",
      "00", "          ",     // Authorization
      "00", "          ",     // Security
      "ZZ", senderId,
      "ZZ", receiverId,
      dateShort, time,
      REP_SEP,                // ISA11 Repetition Separator
      "00501",                // Version
      isaCtl,
      "0",                    // Acknowledgment Requested
      ctx.usageIndicator || "T",
      SUB_SEP                 // Component element separator
    ].join(ELEMENT_SEP) + SEG_TERM);

    // GS
    lines.push(segment("GS", "BE", clean(ctx.senderId || "SENDER"), clean(ctx.receiverId || "RECEIVER"),
      dateLong, time, gsCtl, "X", "005010X220A1"));

    // ST
    lines.push(segment("ST", "834", stCtl, "005010X220A1"));

    // BGN — Beginning Segment. BGN01="00" (Original); BGN08 is the scenario action code.
    const bgnRef = "TX" + dateLong + isaCtl.slice(-4);
    lines.push(segment("BGN", "00", bgnRef, dateLong, time, "ET", "", "", scenario.bgn08 || "00"));

    // REF*38 — Master Policy Number
    if (ctx.groupNumber) {
      lines.push(segment("REF", "38", clean(ctx.groupNumber)));
    }
    // DTP*007 — File Effective Date
    if (ctx.effectiveDate) {
      lines.push(segment("DTP", "007", "D8", isoToEdiDate(ctx.effectiveDate)));
    }

    // QTY — Total members in file
    const memberCount =
      1 +
      (scenario.includesDependent ? 1 : 0) +
      (scenario.extraDependents ? scenario.extraDependents.length : 0) +
      (scenario.extraMembers || 0);
    lines.push(segment("QTY", "TO", memberCount));

    // 1000A — Sponsor (N1*P5)
    lines.push(segment(
      "N1", "P5",
      (ctx.sponsorName || "").toUpperCase(),
      "FI", clean(ctx.sponsorTaxId)
    ));

    // 1000B — Payer (N1*IN)
    lines.push(segment(
      "N1", "IN",
      (ctx.payerName || "").toUpperCase(),
      "FI", clean(ctx.payerId)
    ));

    // 2000 loop — Subscriber + dependents
    const subscriber = {
      subscriberId: ctx.subscriberId,
      ssn: ctx.ssn,
      firstName: ctx.firstName,
      lastName: ctx.lastName,
      middleName: ctx.middleName,
      dateOfBirth: ctx.dateOfBirth,
      gender: ctx.gender,
      maritalStatus: ctx.maritalStatus,
      addressLine1: ctx.addressLine1,
      addressLine2: ctx.addressLine2,
      city: ctx.city,
      state: ctx.state,
      zip: ctx.zip,
      phone: ctx.phone,
      email: ctx.email
    };
    if (scenario.includesSubscriber !== false) {
      lines.push(...buildMemberLoop(subscriber, scenario, ctx, true));
    }

    // Single dependent (e.g. add spouse / child scenarios)
    if (scenario.includesDependent) {
      const dep = {
        depFirstName: ctx.depFirstName,
        depLastName: ctx.depLastName,
        depDateOfBirth: ctx.depDateOfBirth,
        depGender: ctx.depGender,
        depSsn: ctx.depSsn,
        subscriberId: ctx.subscriberId,
        relationship: ctx.dependentRelationship || scenario.ins02
      };
      lines.push(...buildMemberLoop(dep, scenario, ctx, false));
    }

    // Multi-dependent scenarios (Family enrollment)
    if (scenario.extraDependents && scenario.extraDependents.length) {
      for (const meta of scenario.extraDependents) {
        const generated =
          meta.role === "spouse"
            ? Object.assign(SAMPLE_DATA.randomDependent("01"), {})
            : SAMPLE_DATA.randomDependent("19");
        const dep = {
          depFirstName: generated.depFirstName,
          depLastName: ctx.lastName,
          depDateOfBirth: generated.depDateOfBirth,
          depGender: generated.depGender,
          depSsn: generated.depSsn,
          subscriberId: ctx.subscriberId,
          relationship: meta.relationship
        };
        lines.push(...buildMemberLoop(dep, scenario, ctx, false));
      }
    }

    // Multi-member scenarios (Full File Replacement)
    if (scenario.extraMembers) {
      for (let i = 0; i < scenario.extraMembers; i++) {
        const r = SAMPLE_DATA.randomMember();
        lines.push(...buildMemberLoop(r, scenario, ctx, true));
      }
    }

    // Compute SE / GE / IEA trailers
    // SE counts include ST and SE itself.
    const stIndex = lines.findIndex(l => l.startsWith("ST*"));
    const segCountBetweenSt = lines.slice(stIndex).length + 1; // +1 for SE
    lines.push(segment("SE", segCountBetweenSt, stCtl));
    lines.push(segment("GE", "1", gsCtl));
    lines.push(segment("IEA", "1", isaCtl));

    const ediString = lines.join("");

    // Build segment objects for annotated view
    const segments = lines.map(line => {
      const stripped = line.replace(SEG_TERM, "");
      const id = stripped.split(ELEMENT_SEP)[0];
      return {
        id,
        raw: line,
        content: stripped,
        description: SEGMENT_DESCRIPTIONS[id] || ""
      };
    });

    return { ediString, segments };
  }

  window.EDI834 = {
    generate,
    SEG_TERM,
    ELEMENT_SEP,
    SUB_SEP
  };
})();
