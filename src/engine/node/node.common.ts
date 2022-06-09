import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const NodeResourceType = "node";

export const rendererNodeSchema = defineObjectBufferSchema({
  visible: [Uint8Array, 1],
  static: [Uint8Array, 1],
  worldMatrix: [Float32Array, 16],
  mesh: [Uint32Array, 1],
  light: [Uint32Array, 1],
  camera: [Uint32Array, 1],
});

export const audioNodeSchema = defineObjectBufferSchema({
  enabled: [Uint8Array, 1],
  static: [Uint8Array, 1],
  worldMatrix: [Float32Array, 16],
  audioEmitter: [Uint32Array, 1],
});

export type RendererSharedNode = TripleBufferBackedObjectBufferView<typeof rendererNodeSchema, ArrayBuffer>;

export type AudioSharedNode = TripleBufferBackedObjectBufferView<typeof audioNodeSchema, ArrayBuffer>;

export interface RendererNodeResourceProps {
  light: ResourceId;
  camera: ResourceId;
  mesh: ResourceId;
  static: boolean;
}

export type RendererSharedNodeResource = {
  initialProps: RendererNodeResourceProps;
  sharedNode: RendererSharedNode;
};

export interface AudioNodeResourceProps {
  audioEmitter: ResourceId;
  static: boolean;
}

export type AudioSharedNodeResource = {
  initialProps: AudioNodeResourceProps;
  sharedNode: AudioSharedNode;
};
