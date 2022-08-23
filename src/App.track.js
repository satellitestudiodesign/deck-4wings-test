import { useState, useMemo } from "react";
import Map from "react-map-gl";
import maplibregl from "maplibre-gl";
import DeckGL from "@deck.gl/react";
import { BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import VesselLayer from './layers/VesselLayer'
import {FpsView} from "react-fps";
import "./App.css";
import { trackLoader } from "./loader/trackLoader";

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

const STEP = 500000000

const IDS = [
  "896e258e6-6725-151c-f7b0-c144b8b0607c",
  "cdefeb4c3-3220-7fdd-5258-f60985c5743c",
  "89e8d689b-b314-4541-1d92-9ea8c4ee0bc3",
  "2ca6e6aad-dbd6-cc3e-8ecd-90df5c64bd14",
  "27b096e2c-c140-f4d2-4acd-e9a5ab840d6e",
  "0d25cd4be-e4bf-5d89-d1fa-33235c69a5a5",
  "3c447ad31-1c26-2868-736e-2fccb6120740",
  "a5f722af6-6855-33d5-32b5-78ff223c462c",
  "5b44ba962-2bbb-cafe-35bf-4aba593b396f",
  "890a71548-8701-0fe4-dd8c-baff4f7f9eec",
  "d6b5fce04-4235-9a2c-be61-b45bf6b583c4",
  "026995043-38ee-18fa-8433-9b1be40ccc05"
]

function App() {
  const [minFrame, setMinFrame] = useState(1560610823000);
  const [maxFrame, setMaxFrame] = useState(1577384595000);
  const [minHighlightedFrame, setMinHighlightedFrame] = useState(1565610823000);
  const [maxHighlightedFrame, setMaxHighlightedFrame] = useState(1568384595000);

  const layers = useMemo(
    () => {
      return [ basemap, 
        new VesselLayer({
          id: 'trips-layer',
          data: `tracks/track`,
          loaders: [trackLoader(maxFrame)],
          getPath: (d) => {
            // console.log('coordinates', d.waypoints.map(p => p.coordinates));
            return d.waypoints.map(p => p.coordinates)
          },
          getTimestamps: (d) => {
            // console.log('timestamps', d.waypoints.map(p => p.timestamp - 1465864039000));
            // deduct start timestamp from each data point to avoid overflow
            return d.waypoints.map(p => p.timestamp)
          },
          getColor: (d) => {
            return d.waypoints.map(p => {
              if (p.timestamp >= minHighlightedFrame  && p.timestamp <= maxHighlightedFrame) {
                return [255,0,0,255]
              }
              return [0,0,0,255]
            })
            },
          getWidth: (d) => {
            return d.waypoints.map(p => p.timestamp >= minHighlightedFrame
              && p.timestamp <= maxHighlightedFrame ? 5 : 1)
            },
          updateTriggers: {
            getColor: [minHighlightedFrame, maxHighlightedFrame],
            getWidth: [minHighlightedFrame, maxHighlightedFrame], 
          },
          // getColor: [0,0,0,255],
          widthUnits: 'pixels',
          widthScale: 1,
          wrapLongitude: true,
          jointRounded: true,
          capRounded: true,
          pickable: true,
          startTime: minFrame,
          endTime: maxFrame
        })
      ]
    },
    [maxFrame, minFrame, maxHighlightedFrame, minHighlightedFrame]
  );

  // setInterval(()=> {
  //   if ( minFrame > 0) {
  //     setMinFrame((minFrame) => minFrame - 500000)
  //     setMaxFrame((maxFrame) => maxFrame - 500000)
  //   }
  // }, 16)

  return (
    <>
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapLib={maplibregl}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle={{
          version: 8,
          sources: {},
          layers: [],
        }}
        showTileBoundaries={true}
      >
        <DeckGL
          controller={true}
          initialViewState={INITIAL_VIEW_STATE}
          layers={layers}
          getTooltip={({ object }) => object && `value: ${object.colorValue}`}
        />
      </Map>
      <div style={{ position: "fixed", top: 0, right:0 }}>
        <div>
          TRACK start
          <input
            type="number"
            value={minFrame}
            step={STEP}
            onChange={(e) => setMinFrame(parseInt(e.target.value))}
          />
          end
          <input
            type="number"
            value={maxFrame}
            step={STEP}
            onChange={(e) => setMaxFrame(parseInt(e.target.value))}
          />
        </div>
        <div>
          HIGHLIGHT start
          <input
            type="number"
            value={minHighlightedFrame}
            step={STEP}
            onChange={(e) => setMinHighlightedFrame(parseInt(e.target.value))}
          />
          end
          <input
            type="number"
            value={maxHighlightedFrame}
            step={STEP}
            onChange={(e) => setMaxHighlightedFrame(parseInt(e.target.value))}
          />
        </div>
        {/* {`${minFrame} - ${maxFrame}`} */}
      </div>
      <FpsView />
    </>
  );
}

export default App;
