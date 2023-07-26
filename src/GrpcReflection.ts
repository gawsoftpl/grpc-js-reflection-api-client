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
import {ListMethodsType} from "./Types/ListMethodsType";
import {MethodDefinition} from "@grpc/grpc-js/build/src/make-client";


export class GrpcReflection {

    private serverReflectionPackageObj;
    private serverReflectionPackageDefinition;
    private client;
    private version;

    private host: string;
    private credentials: grpc.ChannelCredentials;
    private options: grpc.ChannelOptions;

    constructor(
        host: string,
        credentials: grpc.ChannelCredentials,
        options: grpc.ChannelOptions = {},
        version: string = "v1alpha"
    ) {
        this.version = version;
        this.serverReflectionPackageObj = protoLoader.loadSync(this.getProtoReflectionPath());

        this.host = host;
        this.credentials = credentials;
        this.options = options;

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

    async listMethods(service: string): Promise<Array<ListMethodsType>>
    {
        //'eadp.playersearch.grpc.search.v1.service.PlayerSearch'
        const descriptor: Descriptor = await this.getDescriptorBySymbol(service);
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
        let anti_recusive = 0
        let actualDescriptor : any = descriptor;
        let found = false;
        const path = this.generateServicePath(service);
        do {
            const service = path.pop();
            if (service && service in actualDescriptor){
                actualDescriptor = actualDescriptor[service];
                found = true;
            }
            anti_recusive++;
        }while(anti_recusive < 100 || !found);
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
                reject(new ReflectionRequestException(err));
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
        let needsDependencyResolution: Array<string> = [];

        for(const item of fileDescriptorProtoBytes){
            const fileDescriptorProto = FileDescriptorProto.decode(
                item as Uint8Array
            ) as IFileDescriptorProto;

            // Mark for dependency resolution, but do not resolve yet to avoid extra file_by_filename lookups
            if (fileDescriptorProto.dependency) {
                const dependencies = fileDescriptorProto.dependency as Array<string>;
                for (const dep of dependencies) {
                    console.log(`Marking ${dep} for future resolution`)
                    needsDependencyResolution.push(dep);
                }
            }

            if (!fileDescriptorProtos.has(fileDescriptorProto.name as string)) {
                console.log(`Adding ${fileDescriptorProto.name} to map`)
                fileDescriptorProtos.set(
                    fileDescriptorProto.name as string,
                    fileDescriptorProto
                );
            }
        }

        // Resolve dependencies
        for (const dep of needsDependencyResolution) {
            if (fileDescriptorProtos.has(dep)) {
                console.log(`Skipping ${dep} because it is already resolved`)
                continue;
            }
            const depProtoBytes = await this.getProtoDescriptorByFileName(dep);
            const protoDependencies = await this.resolveDescriptorRecursive(
                depProtoBytes as Array<Uint8Array | string>
            );
            fileDescriptorProtos = new Map([
                ...fileDescriptorProtos,
                ...protoDependencies,
            ]);
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

