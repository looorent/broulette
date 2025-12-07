import {
  type RouteConfig,
  route,
  index,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("./routes/home/route.tsx"),
  ...prefix("searches", [
    index("./routes/new-search.tsx"),
    route(":searchId?", "./routes/search.tsx"),
    route(":searchId/selections/:selectionId?", "./routes/selection.tsx"),
  ]),

  route("api/address-searches", "./routes/api/address-search.tsx"),
] satisfies RouteConfig;
