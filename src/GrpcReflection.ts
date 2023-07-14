import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { ReflectionRequestException } from './Exceptions';
import * as protobufjs from 'protobufjs';
import { Descriptor } from "./Descriptor";
import { GetAllExtensionNumbersOfType } from "./Types";
import {
    FileDescriptorSet,
    IFileDescriptorProto,
    FileDescriptorProto,
} from 'protobufjs/ext/descriptor';
import * as set from 'lodash.set';


export class GrpcReflection {

    private serverReflectionPackageObj;
    private serverReflectionPackageDefinition;
    private client;
    private version;

    constructor(
        host: string,
        credentials: grpc.ChannelCredentials,
        options: grpc.ChannelOptions = {},
        version: string = "v1alpha"
    ) {
        this.version = version;
        this.serverReflectionPackageObj = protoLoader.loadSync(this.getProtoReflectionPath());

        this.serverReflectionPackageDefinition = grpc.loadPackageDefinition(this.serverReflectionPackageObj);
        if (this.version == 'v1'){
            this.client = new this.serverReflectionPackageDefinition.grpc.reflection.v1.ServerReflection(
                host,
                credentials,
                options
            );
        }else if (this.version='v1alpha'){
            this.client = new this.serverReflectionPackageDefinition.grpc.reflection.v1alpha.ServerReflection(
                host,
                credentials,
                options
            );
        }else{
            throw new ReflectionRequestException('Unknown proto version available: [v1, v1alpha]')
        }
    }

    /**
     * List the full names of registered services
     * @throws ReflectionRequestException ReflectionException
     * @param prefix
     */
    async listServices(prefix: string = '*'): Promise<Array<string>>{

        const response = await this.request({
            listServices: prefix
        });
        return response.listServicesResponse.service.map(service => service.name);
    }

    /**
     * Find a proto file by the file name.
     * eg: examples/helloworld/helloworld/helloworld.proto
     * eg: helloworld.proto
     * @throws ReflectionRequestException ReflectionException
     * @param file_name
     */
    async getDescriptorByFileName(file_name: string): Promise<Descriptor>
    {
        const descriptor = await this.getProtoDescriptorByFileName(file_name);
        return await this.resolveFileDescriptorSet(descriptor);
    }

    /**
     * Find the proto file that declares the given fully-qualified symbol name.
     * (e.g. <package>.<service>[.<method>] or <package>.<type>).
     * @throws ReflectionRequestException ReflectionException
     * @param symbol
     */
    async getDescriptorBySymbol(symbol: string): Promise<Descriptor>
    {
        const descriptor = await this.getProtoDescriptorBySymbol(symbol);
        return await this.resolveFileDescriptorSet(descriptor);
    }

    /**
     * Finds the tag numbers used by all known extensions of the given message
     * Format is <package>.<type>
     * @throws ReflectionRequestException ReflectionException
     */
    async getAllExtensionNumbersOfType(package_type: string): Promise<GetAllExtensionNumbersOfType> {
        const response = await this.request({
            allExtensionNumbersOfType: package_type
        });

        return {
            base_type_name: response.allExtensionNumbersResponse.baseTypeName,
            extension_number: typeof(response.allExtensionNumbersResponse.extensionNumber) !== "undefined" ? response.allExtensionNumbersResponse.extensionNumber : []
        };

    }

    /**
     * Send request to grpc reflection server
     *
     * @param payload
     * @throws ReflectionRequestException ReflectionException
     * @private
     */
    private async request(
        payload: Record<string, any>
    ): Promise<any>{
        return new Promise((resolve, reject) => {
            const call = this.client.ServerReflectionInfo();
            call.on('data', (data) => {
                if (data.errorResponse){
                    reject(new ReflectionRequestException(data.errorResponse.errorMessage));
                    return;
                }
                resolve(data);
            });
            call.on('error', (err) => {
                throw new ReflectionRequestException(err);
            });
            call.on('end', () => {});
            call.write(payload);
            call.end();
        });
    }

    /**
     * @copyright https://github.com/redhoyasa/grpc-reflection-js
     * @param fileDescriptorProtoBytes
     * @private
     */
    private async resolveFileDescriptorSet(
        fileDescriptorProtoBytes: Array<Uint8Array | string> | undefined
    ): Promise<Descriptor> {
        const fileDescriptorSet = FileDescriptorSet.create();
        const fileDescriptorProtos = await this.resolveDescriptorRecursive(
            fileDescriptorProtoBytes as Array<Uint8Array | string>
        );
        set(fileDescriptorSet, 'file', Array.from(fileDescriptorProtos.values()));
        //@ts-ignore
        return new Descriptor(protobufjs.Root.fromDescriptor(fileDescriptorSet));
    }

    /**
     * @copyright https://github.com/redhoyasa/grpc-reflection-js
     * @param fileDescriptorProtoBytes
     * @private
     */
    private async resolveDescriptorRecursive(
        fileDescriptorProtoBytes: Array<Uint8Array | string>
    ): Promise<Map<string, IFileDescriptorProto>> {
        let fileDescriptorProtos: Map<string, IFileDescriptorProto> = new Map();

        for(const item of fileDescriptorProtoBytes){
            const fileDescriptorProto = FileDescriptorProto.decode(
                item as Uint8Array
            ) as IFileDescriptorProto;

            if (fileDescriptorProto.dependency) {
                const dependencies = fileDescriptorProto.dependency as Array<string>;
                for (const dep of dependencies) {
                    const depProtoBytes = await this.getProtoDescriptorByFileName(dep);
                    const protoDependencies = await this.resolveDescriptorRecursive(
                        depProtoBytes as Array<Uint8Array | string>
                    );
                    fileDescriptorProtos = new Map([
                        ...fileDescriptorProtos,
                        ...protoDependencies,
                    ]);
                }
            }

            if (!fileDescriptorProtos.has(fileDescriptorProto.name as string)) {
                fileDescriptorProtos.set(
                    fileDescriptorProto.name as string,
                    fileDescriptorProto
                );
            }
        }
        return fileDescriptorProtos;
    }

    private async getProtoDescriptorBySymbol(symbol: string): Promise<Array<Uint8Array | string>>
    {
        const response = await this.request({
            fileContainingSymbol: symbol
        });
        return response.fileDescriptorResponse.fileDescriptorProto;
    }


    private async getProtoDescriptorByFileName(file_name: string): Promise<Array<Uint8Array | string>>
    {
        const response = await this.request({
            fileByFilename: file_name
        });
        return response.fileDescriptorResponse.fileDescriptorProto
    }


    private getProtoReflectionPath(): string
    {
        return `${path.resolve(__dirname)}/../proto/${this.version}.proto`;
    }

}

