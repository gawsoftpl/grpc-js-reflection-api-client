import { Root } from 'protobufjs';
import {
    FileDescriptorSet
} from 'protobufjs/ext/descriptor';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';

export class Descriptor {

    private root: Root;

    constructor(protoBufJsRoot: Root) {
        this.root = protoBufJsRoot;
    }

    getProtobufJsRoot(): Root {
        return this.root;
    }

    getDescriptorMessage(protoVersion: string = "proto2") {
        return this.root.toDescriptor(protoVersion);
    }

    getBuffer(protoVersion: string = "proto2"): Uint8Array {
        return FileDescriptorSet.encode(this.getDescriptorMessage(protoVersion)).finish();
    }

    getPackageDefinition(options?: protoLoader.Options, protoVersion: string = "proto2") {
        return protoLoader.loadFileDescriptorSetFromObject(this.getDescriptorMessage(protoVersion), options);
    }

    getPackageObject(options?: protoLoader.Options): any {
        return grpc.loadPackageDefinition(this.getPackageDefinition(options));
    }


}