import { useState, useMemo } from "react";
import DeckGL from "@deck.gl/react";
import { BitmapLayer } from "@deck.gl/layers";
import { GPUGridLayer } from "@deck.gl/aggregation-layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { fourWingsLoader } from "./loader/fourWingsLoader";
import "./App.css";

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 0,
};

const basemap = new TileLayer({
  // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
  id: "basemap",
  data: "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
  minZoom: 0,
  maxZoom: 19,
  tileSize: 256,
  renderSubLayers: (props) => {
    const {
      bbox: { west, south, east, north },
    } = props.tile;
    return new BitmapLayer(props, {
      data: null,
      image: props.data,
      bounds: [west, south, east, north],
    });
  },
});

function App() {
  const [minFrame, setMinFrame] = useState(18962);
  const [maxFrame, setMaxFrame] = useState(18992);
  const layers = useMemo(
    () =>
      [ basemap, 
        new TileLayer({
        id: "grid",
        data: "tiles/{z}/{x}/{y}",
        minZoom: 0,
        maxZoom: 0,
        tileSize: 256,
        loaders: [fourWingsLoader(minFrame, maxFrame)],
        loadOptions: { worker: false },
        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
          } = props.tile;
          console.log(
            "before GridCellLayer:",
            props,
            west,
            south,
            east,
            north
          );
          return new GPUGridLayer(props, {
            id: "grid-cell-layer",
            data: props.data,
            pickable: true,
            cellSize: 40075017 / 113,
            getPosition: (d) => d.centroid,
            getColorWeight: (d) => d.value,
            colorDomain: [0.001, 10000],
            bounds: [west, south, east, north],
          });
        },
      })],
    [maxFrame, minFrame]
  );

  return (
    <>
      <DeckGL
          controller={true}
          initialViewState={INITIAL_VIEW_STATE}
          layers={layers}
          getTooltip={({ object }) => object && `value: ${object.colorValue}`}
        />
      <div style={{ position: "fixed", top: 0 }}>
        <input
          type="number"
          value={minFrame}
          onChange={(e) => setMinFrame(e.target.value)}
        />
        <input
          type="number"
          value={maxFrame}
          onChange={(e) => setMaxFrame(e.target.value)}
        />
      </div>
    </>
  );
}

export default App;
