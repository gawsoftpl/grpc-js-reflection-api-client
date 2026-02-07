import { Root } from 'protobufjs';
// Import the descriptor extension module.
// Note: In v8, we ensure the side-effect (patching Root) is applied.
import * as descriptor from 'protobufjs/ext/descriptor';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';
import { PackageDefinition } from "@grpc/proto-loader";

declare module 'protobufjs' {
    interface Root {
        toDescriptor(syntax: string): protobuf.Message;
    }
}

export class Descriptor {

    private root: Root;

    constructor(protoBufJsRoot: Root) {
        this.root = protoBufJsRoot;
        // Verify that the descriptor extension has patched the root instance.
        // This is critical in v8 to ensure .toDescriptor() exists.
        if (typeof this.root.toDescriptor !== 'function') {
            throw new Error("Protobuf.js 'ext/descriptor' module was not correctly loaded.");
        }
    }

    getProtobufJsRoot(): Root {
        return this.root;
    }

    /**
     * Converts the Root instance to a FileDescriptorSet message.
     * * @param syntax - The protobuf syntax version.
     * In v8, this supports 'proto2', 'proto3', and Editions (e.g., 'edition2023').
     */
    getDescriptorMessage(syntax: string = "proto3") {
        return this.root.toDescriptor(syntax);
    }

    /**
     * Encodes the descriptor message to a Uint8Array buffer.
     */
    getBuffer(syntax: string = "proto3"): Uint8Array {
        const message = this.getDescriptorMessage(syntax);
        // Use the imported descriptor module to access the FileDescriptorSet encoder
        return descriptor.FileDescriptorSet.encode(message).finish();
    }

    getPackageDefinition(options?: protoLoader.Options, syntax: string = "proto3"): PackageDefinition {
        const descriptorMessage = this.getDescriptorMessage(syntax);

        // protoLoader expects a plain object representation of the descriptor set
        // We use .toObject() to ensure compatibility if v8 internal class structures changed.
        const descriptorObject = descriptor.FileDescriptorSet.toObject(descriptorMessage, {
            defaults: true,
            enums: String,
            longs: String,
            oneofs: true,
        });

        return protoLoader.loadFileDescriptorSetFromObject(
            descriptorObject,
            options
        );
    }

    getPackageObject(options?: protoLoader.Options): grpc.GrpcObject {
        return grpc.loadPackageDefinition(this.getPackageDefinition(options));
    }
}