# Cosmos Member Service

A MuleSoft application for managing member details in Azure Cosmos DB.

## Features

- **Create Member**: Insert new member details into Cosmos DB
- **Get Member**: Retrieve member details by member ID
- **Update Member**: Update existing member information
- **Delete Member**: Remove member from the database
- **Health Check**: Service health monitoring endpoint

## Prerequisites

- MuleSoft Anypoint Studio 7.x or later
- Java 8 or later
- Maven 3.6 or later
- Azure Cosmos DB account

## Setup Instructions

### 1. Configure Cosmos DB

1. Create an Azure Cosmos DB account
2. Create a database named `member-database`
3. Create a container named `members` with partition key `/memberId`
4. Update `config/config.yaml` with your Cosmos DB credentials:

```yaml
cosmosdb:
  endpoint: "https://your-cosmosdb-account.documents.azure.com:443/"
  accessKey: "your-cosmosdb-access-key"
  databaseName: "member-database"
  collectionName: "members"
```

### 2. Build and Run

```bash
# Build the application
mvn clean package

# Run the application
mvn mule:run
```

The application will start on `http://localhost:8081`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/members` | Create a new member |
| GET | `/members/{memberId}` | Get member by ID |
| PUT | `/members/{memberId}` | Update member |
| DELETE | `/members/{memberId}` | Delete member |
| GET | `/health` | Health check |

## Sample Usage

### Create a Member
```bash
curl -X POST http://localhost:8081/members \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "MEMBER001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567"
  }'
```

### Get a Member
```bash
curl -X GET http://localhost:8081/members/MEMBER001
```

## Data Model

```json
{
  "id": "cosmos-generated-id",
  "memberId": "MEMBER001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-123-4567",
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Error Handling

The application includes comprehensive error handling for:
- Validation errors (400 Bad Request)
- Not found errors (404 Not Found)
- Conflict errors (409 Conflict)
- Internal server errors (500 Internal Server Error)

## Dependencies

- Mule HTTP Connector
- Azure Cosmos DB Connector
- Mule JSON Module
- Mule Validation Module

## License

This project is licensed under the MIT License.
