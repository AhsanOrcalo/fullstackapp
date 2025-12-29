# Migration Summary: TypeORM/SQLite to MongoDB/Mongoose

## What Changed

### 1. Database Layer
- **Before:** TypeORM with SQLite
- **After:** Mongoose with MongoDB

### 2. Entity Files → Schema Files
All entity files have been converted to Mongoose schemas:
- `src/users/entities/user.entity.ts` → `src/users/schemas/user.schema.ts`
- `src/leads/entities/lead.entity.ts` → `src/leads/schemas/lead.schema.ts`
- `src/purchases/entities/purchase.entity.ts` → `src/purchases/schemas/purchase.schema.ts`
- `src/enquiries/entities/enquiry.entity.ts` → `src/enquiries/schemas/enquiry.schema.ts`

### 3. ID System
- **Before:** UUID strings
- **After:** MongoDB ObjectId (converted to string when needed)

### 4. Dependencies
**Removed:**
- `@nestjs/typeorm`
- `typeorm`
- `sqlite3`

**Added:**
- `@nestjs/mongoose`
- `mongoose`

### 5. Module Updates
All modules now use `MongooseModule` instead of `TypeOrmModule`:
- `app.module.ts`
- `users.module.ts`
- `leads.module.ts`
- `purchases.module.ts`
- `enquiries.module.ts`
- `dashboard.module.ts`

### 6. Service Updates
All services have been updated to use Mongoose models:
- `UsersService` - Uses `Model<UserDocument>`
- `LeadsService` - Uses `Model<LeadDocument>`
- `PurchasesService` - Uses `Model<PurchaseDocument>`
- `EnquiriesService` - Uses `Model<EnquiryDocument>`
- `DashboardService` - Uses multiple models

### 7. Query Changes
- TypeORM `findOne({ where: { id } })` → Mongoose `findById(id)`
- TypeORM `find({ where: { field: value } })` → Mongoose `find({ field: value })`
- TypeORM `relations: ['field']` → Mongoose `.populate('field')`
- TypeORM `createQueryBuilder()` → Mongoose query methods
- TypeORM `count()` → Mongoose `countDocuments()`

## Breaking Changes

1. **ID Format:** IDs are now MongoDB ObjectIds instead of UUIDs. The application converts them to strings automatically, but if you have external systems or frontend code that expects UUIDs, you'll need to update them.

2. **Relations:** Relations are now handled via `.populate()` instead of TypeORM's `relations` option.

3. **Queries:** Complex queries using TypeORM's QueryBuilder have been converted to Mongoose query syntax.

## Environment Variables

Add to your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/cart-backend
```

## Next Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set Up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in `.env`

3. **Test Locally:**
   ```bash
   npm run build
   npm run start:prod
   ```

4. **Data Migration (if needed):**
   If you have existing SQLite data, you'll need to:
   - Export data from SQLite
   - Transform data format (UUIDs to ObjectIds)
   - Import into MongoDB
   
   Consider writing a migration script if you have production data.

5. **Update Frontend (if needed):**
   - Verify API responses still match expected format
   - Check if ID format changes affect your frontend

## Notes

- Old entity files still exist but are no longer used
- The application will create the admin user automatically on first start
- MongoDB will create collections automatically when first used
- No database migrations needed - MongoDB is schema-less

## Testing Checklist

- [ ] User registration
- [ ] User login
- [ ] JWT authentication
- [ ] Lead creation
- [ ] Lead filtering
- [ ] Purchase functionality
- [ ] Enquiry creation
- [ ] Dashboard statistics
- [ ] Admin operations

