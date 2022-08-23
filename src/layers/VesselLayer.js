// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// import type {NumericArray} from '@math.gl/core';
// import {AccessorFunction, DefaultProps} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';

const defaultProps = {
  startTime: {type: 'number', value: 0, min: 0},
  endTime: {type: 'number', value: 0, min: 0},
  getTimestamps: {type: 'accessor', value: d => d.timestamps}
};

/** All properties supported by TripsLayer. */
// export type TripsLayerProps<DataT = any> = _TripsLayerProps<DataT> & PathLayerProps<DataT>;

/** Properties added by TripsLayer. */
// type _TripsLayerProps<DataT = any> = {
//   /**
//    * Whether or not the path fades out.
//    * @default true
//    */
//   fadeTrail?: boolean;
//   /**
//    * Trail length.
//    * @default 120
//    */
//   trailLength?: number;
//   /**
//    * The current time of the frame.
//    * @default 0
//    */
//   currentTime?: number;
//   /**
//    * Timestamp accessor.
//    */
//   getTimestamps?: AccessorFunction<DataT, NumericArray>;
// };

/** Render animated paths that represent vehicle trips. */
export default class VesselLayer extends PathLayer {
  static layerName = 'VesselLayer';
  static defaultProps = defaultProps;

  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#decl': `\
attribute float instanceTimestamps;
attribute float instanceNextTimestamps;
varying float vTime;
`,
      // Timestamp of the vertex
      'vs:#main-end': `\
vTime = instanceTimestamps + (instanceNextTimestamps - instanceTimestamps) * vPathPosition.y / vPathLength;
`,
      'fs:#decl': `\
uniform float startTime;
uniform float endTime;
varying float vTime;
`,
      // Drop the segments outside of the time window
      'fs:#main-start': `\
if(vTime < startTime || vTime > endTime) {
  discard;
}
`
    };
    return shaders;
  }

  initializeState() {
    super.initializeState();

    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      timestamps: {
        size: 1,
        accessor: 'getTimestamps',
        shaderAttributes: {
          instanceTimestamps: {
            vertexOffset: 0
          },
          instanceNextTimestamps: {
            vertexOffset: 1
          }
        }
      }
    });
  }

  draw(params) {
    const {startTime, endTime} = this.props;

    params.uniforms = {
      ...params.uniforms,
      startTime,
      endTime
    };

    super.draw(params);
  }
}