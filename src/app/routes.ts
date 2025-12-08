import {
  type RouteConfig,
  route,
  index,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("./routes/home/route.tsx"),
  ...prefix("searches", [
    index("./routes/search-post/route.tsx"),
    ...prefix(":searchId", [
      index("./routes/search/route.tsx"),
      ...prefix("selections", [
        index("./routes/selection-post/route.tsx"),
        ...prefix(":selectionId", [
          index("./routes/selection/route.tsx"),
        ])
      ])
    ])
  ]),

  route("api/address-searches", "./routes/api/address-search.tsx"),
] satisfies RouteConfig;
