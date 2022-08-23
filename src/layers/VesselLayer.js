import {PathLayer} from '@deck.gl/layers';

const defaultProps = {
  startTime: {type: 'number', value: 0, min: 0},
  endTime: {type: 'number', value: 0, min: 0},
  getTimestamps: {type: 'accessor', value: d => d.timestamps}
};

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

  getSegments() {
    return this.segments
  }

  updateState(param) {
    super.updateState(param)
    this.segments = param.props.data;
  }
  
  initializeState() {
    super.initializeState();
    this.segments = [];
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