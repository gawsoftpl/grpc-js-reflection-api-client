import { Root, Message } from 'protobufjs';
import {
    FileDescriptorSet
} from 'protobufjs/ext/descriptor';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';
import { PackageDefinition } from "@grpc/proto-loader";

interface IRootWithDescriptor extends Root {
    toDescriptor(protoVersion: string): Message;
}

export class Descriptor {

    private root: IRootWithDescriptor;

    constructor(protoBufJsRoot: IRootWithDescriptor) {
        this.root = protoBufJsRoot;
    }

    getProtobufJsRoot(): Root {
        return this.root;
    }

    getDescriptorMessage(protoVersion: string = "proto3") {
        return this.root.toDescriptor(protoVersion);
    }

    getBuffer(protoVersion: string = "proto3"): Uint8Array {
        return FileDescriptorSet.encode(this.getDescriptorMessage(protoVersion)).finish();
    }

    getPackageDefinition(options?: protoLoader.Options, protoVersion: string = "proto3"): PackageDefinition {
        return protoLoader.loadFileDescriptorSetFromObject(
            this.getDescriptorMessage(protoVersion),
            options
        );
    }

    getPackageObject(options?: protoLoader.Options): grpc.GrpcObject {
        return grpc.loadPackageDefinition(this.getPackageDefinition(options));
    }

}