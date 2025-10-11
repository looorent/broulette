export type OverpassRestaurantType = "way" | "node" | "relation";

export class OverpassRestaurant {
    constructor(readonly id: number,
        readonly type: OverpassRestaurantType,
        readonly name: string,
        readonly latitude: number,
        readonly longitude: number,
        readonly tags: { (tagName: string): string },
        readonly amenity: string
    ) { }
}

export class OverpassResponse {
    constructor(readonly generator: string,
        readonly version: number,
        readonly copyright: string,
        readonly timestampInUtc: string,
        readonly durationInMs: number,
        readonly restaurants: OverpassRestaurant[],
        readonly raw: any) { }
}
