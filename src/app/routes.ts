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
      ...prefix("candidates", [
        index("./routes/candidate/action.ts"),
        ...prefix(":candidateId", [
          index("./routes/candidate/page.tsx"),
        ])
      ])
    ])
  ]),

  ...prefix("api", [
    route("address-searches", "./routes/api/address-search.ts"),
    route("health", "./routes/api/health.ts")
  ])
] satisfies RouteConfig;
