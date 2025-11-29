import {
  type RouteConfig,
  route,
  index,
} from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("searches/new", "./routes/new-search.tsx"),
  route("searches/:searchId?", "./routes/search.tsx"),
  route("searches/:searchId/selections/:selectionId?", "./routes/selection.tsx"),
  // TODO use prefix
] satisfies RouteConfig;
