import { relations } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const TIMESLOTS = ["Dinner", "Lunch", "RightNow", "Custom"] as const;
export const serviceTimeslotEnum = (name: string) => text(name, {
  length: 8,
  enum: TIMESLOTS
});

export const DISTANCE_RANGES = ["Close", "MidRange", "Far"] as const;
export const distanceRangeEnum = (name: string) => text(name, {
  length: 8,
  enum: DISTANCE_RANGES
});

export const CANDIDATE_STATUSES = ["Rejected", "Returned"] as const;
export const searchCandidateStatusEnum = (name: string) => text(name, {
  length: 8,
  enum: CANDIDATE_STATUSES
});

export const CANDIDATE_REJECTION_REASONS = ["missing_coordinates", "unknown_opening_hours", "closed", "no_image", "no_restaurant_found"] as const;
export const searchCandidateRejectionReasonEnum = (name: string) => text(name, {
  length: 40,
  enum: CANDIDATE_REJECTION_REASONS
});

const uuid = (name: string) => text(name, { length: 36 });
const uuidPrimaryKey = () => uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date());

export const restaurants = sqliteTable("restaurant", {
  id: uuidPrimaryKey(),
  createdAt: timestamp("created_at"),
  name: text("name", { length: 100 }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull()
}, (table) => [
  index("idx_restaurant_coordinates").on(table.latitude, table.longitude)
]);

export const restaurantProfiles = sqliteTable("restaurant_profile", {
  id: uuidPrimaryKey(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  source: text("source", { length: 50 }).notNull(),
  externalId: text("external_id", { length: 255 }).notNull(),
  externalType: text("external_type", { length: 50 }).notNull(),
  version: integer("version").notNull().default(1),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  name: text("name"),
  address: text("address"),
  countryCode: text("country_code", { length: 20 }),
  state: text("state", { length: 50 }),
  description: text("description"),
  imageUrl: text("image_url"),
  mapUrl: text("map_url"),
  rating: real("rating"),
  ratingCount: integer("rating_count"),
  phoneNumber: text("phone_number", { length: 20 }),
  internationalPhoneNumber: text("international_phone_number", { length: 25 }),
  priceRange: integer("price_range"),
  priceLabel: text("price_label"),
  openingHours: text("opening_hours"),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  operational: integer("operational", { mode: "boolean"}),
  website: text("website"),
  sourceUrl: text("source_url")
}, (table) => [
  index("idx_restaurant_profile_to_restaurant").on(table.restaurantId)
]);

export const searches = sqliteTable("search", {
  id: uuidPrimaryKey(),
  createdAt: timestamp("created_at"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  serviceDate: integer("service_date", { mode: "timestamp_ms" }).notNull(),
  serviceInstant: integer("service_instant", { mode: "timestamp_ms" }).notNull(),
  serviceEnd: integer("service_end", { mode: "timestamp_ms" }).notNull(),
  serviceTimeslot: serviceTimeslotEnum("service_timeslot").notNull(),
  distanceRange: distanceRangeEnum("distance_range").notNull(),
  exhausted: integer("exhausted", { mode: "boolean" }).default(false).notNull()
}, (table) => [
  index("idx_search_coordinates").on(table.latitude, table.longitude)
]);

export const searchCandidates = sqliteTable("search_candidate", {
  id: uuidPrimaryKey(),
  createdAt: timestamp("created_at"),
  searchId: uuid("search_id").notNull().references(() => searches.id, { onDelete: "cascade" }),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }),
  recoveredFromCandidateId: uuid("recovered_from_candidate_id").references((): any => searchCandidates.id, { onDelete: "set null" }),
  order: integer("order").notNull(),
  status: searchCandidateStatusEnum("status").notNull(),
  rejectionReason: searchCandidateRejectionReasonEnum("rejection_reason")
}, (table) => [
  index("idx_search_candidate_to_search").on(table.searchId),
  index("idx_search_candidate_to_restaurant").on(table.restaurantId),
  index("idx_search_candidate_to_candidate_recovered").on(table.recoveredFromCandidateId)
]);

export const restaurantMatchingAttempts = sqliteTable("restaurant_matching_attempt", {
  id: uuidPrimaryKey(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  attemptedAt: integer("attempted_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  queryType: text("query_type").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  radius: integer("radius"),
  query: text("query"),
  source: text("source").notNull(),
  found: integer("found", { mode: "boolean" }).notNull()
}, (table) => [
  index("idx_matching_attempt_to_restaurant").on(table.restaurantId),
  index("idx_matching_attempt_source_and_restaurant").on(table.source, table.restaurantId),
  index("idx_matching_attempt_source_and_attempted_at").on(table.source, table.attemptedAt)
]);

export const searchesRelations = relations(searches, ({many}) => ({
  candidates: many(searchCandidates)
}));

export const searchCandidatesRelations = relations(searchCandidates, ({one}) => ({
  search: one(searches, {
    fields: [ searchCandidates.searchId ],
    references: [ searches.id ]
  }),
  restaurant: one(restaurants, {
    fields: [ searchCandidates.restaurantId ],
    references: [ restaurants.id ]
  })
}));

export const restaurantsRelations = relations(restaurants, ({many}) => ({
  profiles: many(restaurantProfiles),
  searchCandidates: many(searchCandidates),
  matchingAttempts: many(restaurantMatchingAttempts)
}));

export const restaurantProfilesRelations = relations(restaurantProfiles, ({one}) => ({
  restaurant: one(restaurants, {
    fields: [ restaurantProfiles.restaurantId ],
    references: [ restaurants.id ]
  })
}));

export const restaurantMatchingAttemptsRelations = relations(restaurantMatchingAttempts, ({one}) => ({
  restaurant: one(restaurants, {
    fields: [ restaurantMatchingAttempts.restaurantId ], references: [ restaurants.id ]
  })
}));
