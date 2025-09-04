# Cosmos Member Service API Documentation

## Overview
This MuleSoft application provides RESTful APIs for managing member details in Azure Cosmos DB.

## Base URL
```
http://localhost:8081
```

## Endpoints

### 1. Create Member
**POST** `/members`

Creates a new member in the database.

#### Request Body
```json
{
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
  }
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Member created successfully",
  "memberId": "MEMBER001",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Get Member by ID
**GET** `/members/{memberId}`

Retrieves a member by their member ID.

#### Path Parameters
- `memberId` (string): The unique identifier of the member

#### Response (200 OK)
```json
{
  "id": "generated-cosmos-id",
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

#### Response (404 Not Found)
```json
{
  "error": "Not Found",
  "message": "Member with ID MEMBER001 not found",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Update Member
**PUT** `/members/{memberId}`

Updates an existing member's information.

#### Path Parameters
- `memberId` (string): The unique identifier of the member

#### Request Body
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "+1-555-987-6543",
  "address": {
    "street": "456 Oak Avenue",
    "city": "Los Angeles",
    "state": "CA",
    "zipCode": "90210",
    "country": "USA"
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Member updated successfully",
  "memberId": "MEMBER001",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. Delete Member
**DELETE** `/members/{memberId}`

Deletes a member from the database.

#### Path Parameters
- `memberId` (string): The unique identifier of the member

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Member deleted successfully",
  "memberId": "MEMBER001",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 5. Health Check
**GET** `/health`

Returns the health status of the service.

#### Response (200 OK)
```json
{
  "status": "UP",
  "service": "Cosmos Member Service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Required field is missing",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Member already exists",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Configuration

Update the `config/config.yaml` file with your Cosmos DB credentials:

```yaml
cosmosdb:
  endpoint: "https://your-cosmosdb-account.documents.azure.com:443/"
  accessKey: "your-cosmosdb-access-key"
  databaseName: "member-database"
  collectionName: "members"
```

## Running the Application

1. Update the configuration file with your Cosmos DB details
2. Run the application:
   ```bash
   mvn clean package
   mvn mule:run
   ```

3. The application will be available at `http://localhost:8081`

## Testing with cURL

### Create a member:
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

### Get a member:
```bash
curl -X GET http://localhost:8081/members/MEMBER001
```

### Update a member:
```bash
curl -X PUT http://localhost:8081/members/MEMBER001 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com"
  }'
```

### Delete a member:
```bash
curl -X DELETE http://localhost:8081/members/MEMBER001
```
