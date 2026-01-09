export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapRectangleViewPort {
  bottomLeft: Coordinates;
  topRight: Coordinates;
}
