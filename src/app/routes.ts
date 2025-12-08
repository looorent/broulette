import {
  type RouteConfig,
  route,
  index,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("./routes/home/page.tsx"),
  ...prefix("searches", [
    index("./routes/search/action.ts"),
    ...prefix(":searchId", [
      index("./routes/search/page.tsx"),
      ...prefix("selections", [
        index("./routes/selection/action.ts"),
        ...prefix(":selectionId", [
          index("./routes/selection/page.tsx"),
        ])
      ])
    ])
  ]),

  route("api/address-searches", "./routes/api/address-search.tsx"),
] satisfies RouteConfig;
