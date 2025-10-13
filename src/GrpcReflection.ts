import * as grpc from '@grpc/grpc-js';
import { ReflectionRequestException } from './Exceptions';
import * as protobufjs from 'protobufjs';
import { Descriptor } from "./Descriptor";
import { GetAllExtensionNumbersOfType } from "./Types";
import {
    FileDescriptorSet,
    IFileDescriptorProto,
    FileDescriptorProto,
} from 'protobufjs/ext/descriptor';
import { set } from 'lodash';
import { ListMethodsType } from "./Types/ListMethodsType";
import { MethodDefinition, ServiceClient } from "@grpc/grpc-js/build/src/make-client";
import  * as v1 from "./Proto/v1";
import  * as v1alpha from "./Proto/v1alpha";


export class GrpcReflection {
    private client: ServiceClient;
    private version;
    private reflectionRequestConstructor: (data: any) => v1.grpc.reflection.v1.ServerReflectionRequest | v1alpha.grpc.reflection.v1alpha.ServerReflectionRequest;

    constructor(
        host: string,
        credentials: any,
        options: grpc.ChannelOptions = {},
        version: string = "v1alpha"
    ) {
        this.version = version;
        this.setProtoReflectionClient(host, credentials, options);
    }

    /**
     * List the full names of registered services
     * @throws ReflectionRequestException ReflectionException
     * @param prefix
     * @param options
     */
    async listServices(prefix: string = '*', options: grpc.CallOptions = {}): Promise<Array<string>>{
        const response = await this.request({
            listServices: prefix
        }, options);
        return response.listServicesResponse.service.map(service => service.name);
    }

    async listMethods(service: string, options: grpc.CallOptions = {}): Promise<Array<ListMethodsType>>
    {
        //'eadp.playersearch.grpc.search.v1.service.PlayerSearch'
        const descriptor: Descriptor = await this.getDescriptorBySymbol(service, options);
        const packageObject = descriptor.getPackageObject({
            keepCase: true,
            enums: String,
            longs: String
        });
        return this.getServiceMethods(packageObject, service);
    }

    /**
     * Generate service path
     *
     * @param service
     * @protected
     */
    protected generateServicePath(service: string): Array<string>
    {
        return service.split('.').reverse();
    }

    /**
     * Get service methods from grpc descriptor
     *
     * @param descriptor
     * @param service
     * @protected
     */
    getServiceMethods(descriptor: grpc.GrpcObject, service: string): Array<ListMethodsType>
    {
        let anti_recursive = 0
        let actualDescriptor : any = descriptor;
        const path = this.generateServicePath(service);
        do {
            const serviceName = path.pop();
            if (serviceName && serviceName in actualDescriptor){
                actualDescriptor = actualDescriptor[serviceName];
            }
            anti_recursive++
        } while (path.length > 0 && anti_recursive < 100);
        if ('service' in actualDescriptor) {
            return Object.entries(actualDescriptor.service)
                .map(([methodName, methodDefinition]) => ({
                    name: methodName,
                    definition: methodDefinition as MethodDefinition<any, any>
                }));
        }
        throw new ReflectionRequestException('Not found service');
    }

    /**
     * Find a proto file by the file name.
     * eg: examples/helloworld/helloworld/helloworld.proto
     * eg: helloworld.proto
     *
     * @throws ReflectionRequestException ReflectionException
     * @param file_name
     * @param options
     */
    async getDescriptorByFileName(file_name: string, options: grpc.CallOptions = {}): Promise<Descriptor>
    {
        const descriptor = await this.getProtoDescriptorByFileName(file_name, options);
        return await this.resolveFileDescriptorSet(descriptor, options);
    }

    /**
     * Find the proto file that declares the given fully-qualified symbol name.
     * (e.g. <package>.<service>[.<method>] or <package>.<type>).
     * @throws ReflectionRequestException ReflectionException
     * @param symbol
     * @param options
     */
    async getDescriptorBySymbol(symbol: string, options: grpc.CallOptions = {}): Promise<Descriptor>
    {
        const descriptor = await this.getProtoDescriptorBySymbol(symbol, options);
        return await this.resolveFileDescriptorSet(descriptor, options);
    }

    /**
     * Finds the tag numbers used by all known extensions of the given message
     * Format is <package>.<type>
     * @throws ReflectionRequestException ReflectionException
     */
    async getAllExtensionNumbersOfType(package_type: string, options: grpc.CallOptions = {}): Promise<GetAllExtensionNumbersOfType> {
        const response = await this.request({
            allExtensionNumbersOfType: package_type
        }, options);

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
        payload: Record<string, any>,
        options: grpc.CallOptions
    ): Promise<any>{
        return new Promise((resolve, reject) => {
            const payloadObject = this.reflectionRequestConstructor(payload);
            const call = this.client.ServerReflectionInfo(options);
            call.on('data', (data) => {
                if (data.errorResponse){
                    reject(new ReflectionRequestException(data.errorResponse.errorMessage));
                    return;
                }
                resolve(data);
            });
            call.on('error', (err) => {
                reject(new ReflectionRequestException(err));
            });
            call.on('end', () => {});
            call.write(payloadObject);
            call.end();
        });
    }

    /**
     * @copyright https://github.com/redhoyasa/grpc-reflection-js
     * @param fileDescriptorProtoBytes
     * @param options
     * @private
     */
    private async resolveFileDescriptorSet(
        fileDescriptorProtoBytes: Array<Uint8Array | string> | undefined,
        options: grpc.CallOptions,
    ): Promise<Descriptor> {
        const fileDescriptorSet = FileDescriptorSet.create();
        const fileDescriptorProtos = await this.resolveDescriptorRecursive(
            fileDescriptorProtoBytes as Array<Uint8Array | string>,
            options,
        );
        set(fileDescriptorSet, 'file', Array.from(fileDescriptorProtos.values()));
        //@ts-ignore
        return new Descriptor(protobufjs.Root.fromDescriptor(fileDescriptorSet));
    }

    /**
     * @copyright https://github.com/redhoyasa/grpc-reflection-js
     * @param fileDescriptorProtoBytes
     * @param options
     * @private
     */
    private async resolveDescriptorRecursive(
        fileDescriptorProtoBytes: Array<Uint8Array | string>,
        options: grpc.CallOptions,
    ): Promise<Map<string, IFileDescriptorProto>> {
        let fileDescriptorProtos: Map<string, IFileDescriptorProto> = new Map();
        let needsDependencyResolution: Set<string> = new Set();

        for(const item of fileDescriptorProtoBytes){
            const fileDescriptorProto = FileDescriptorProto.decode(
                item as Uint8Array
            ) as IFileDescriptorProto;

            // Mark for dependency resolution, but do not resolve yet to avoid extra file_by_filename lookups
            if (fileDescriptorProto.dependency) {
                const dependencies = fileDescriptorProto.dependency as Array<string>;
                for (const dep of dependencies) {
                    needsDependencyResolution.add(dep);
                }
            }

            if (!fileDescriptorProtos.has(fileDescriptorProto.name as string)) {
                fileDescriptorProtos.set(
                    fileDescriptorProto.name as string,
                    fileDescriptorProto
                );
            }
        }

        // Resolve dependencies
        for (const dep of needsDependencyResolution) {
            if (fileDescriptorProtos.has(dep)) {
                continue;
            }
            const depProtoBytes = await this.getProtoDescriptorByFileName(dep, options);
            const protoDependencies = await this.resolveDescriptorRecursive(
                depProtoBytes as Array<Uint8Array | string>,
                options,
            );
            fileDescriptorProtos = new Map([
                ...fileDescriptorProtos,
                ...protoDependencies,
            ]);
        }

        return fileDescriptorProtos;
    }

    private async getProtoDescriptorBySymbol(symbol: string, options: grpc.CallOptions): Promise<Array<Uint8Array | string>>
    {
        const response = await this.request({
            fileContainingSymbol: symbol
        }, options);
        return response.fileDescriptorResponse.fileDescriptorProto;
    }


    private async getProtoDescriptorByFileName(file_name: string, options: grpc.CallOptions): Promise<Array<Uint8Array | string>>
    {
        const response = await this.request({
            fileByFilename: file_name
        }, options);
        return response.fileDescriptorResponse.fileDescriptorProto
    }

    private setProtoReflectionClient(host: string, credentials: grpc.ChannelCredentials,
        options: grpc.ChannelOptions = {},): any
    {
        switch (this.version) {
            case 'v1':
                this.client = new v1.grpc.reflection.v1.ServerReflectionClient(
                    host,
                    credentials,
                    options
                );
                this.reflectionRequestConstructor = v1.grpc.reflection.v1.ServerReflectionRequest.fromObject;
                break;
            case 'v1alpha':
                this.client = new v1alpha.grpc.reflection.v1alpha.ServerReflectionClient(
                    host,
                    credentials,
                    options
                );
                this.reflectionRequestConstructor = v1alpha.grpc.reflection.v1alpha.ServerReflectionRequest.fromObject;
                break;
            default:
                throw new ReflectionRequestException('Unknown proto version available: [v1, v1alpha]')
            }
    }
}

