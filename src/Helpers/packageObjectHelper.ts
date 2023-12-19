import {ChannelCredentials, GrpcObject} from "@grpc/grpc-js";
import {Options} from "@grpc/proto-loader";
import {GrpcReflection} from "../GrpcReflection";

type DescriptorServiceHelperOptionsByProtoFileName = {
    proto_filename: string
}

type DescriptorServiceHelperOptionsByProtoSymbol = {
    proto_symbol: string
}

type DescriptorServiceHelperOptionsSelector = DescriptorServiceHelperOptionsByProtoFileName | DescriptorServiceHelperOptionsByProtoSymbol;

export type DescriptorServiceHelperOptions = {
    host: string,
    credentials: ChannelCredentials,
    protoLoaderOptions?: Options
} & DescriptorServiceHelperOptionsSelector;

/**
 * Helper function for fast download packageObject from reflection
 * grpc server with one line code
 *
 * {
 *     host: "127.0.0.1:3000",
 *     credentials: grpc.ChannelCredentia,
 *     proto_filename: "addressbook.proto",
 *     protoLoaderOptions: {
 *       keepCase: true,
 *       enums: String,
 *       longs: String
 *     }
 * }
 * @param options
 *
 */
export const packageObjectHelper = async<T=GrpcObject>(options: DescriptorServiceHelperOptions) : Promise<T> =>
{
    // Connect with grpc server reflection
    const client = new GrpcReflection(
        options.host,
        options.credentials
    );

    // Get services without proto file for specific symbol or file name
    const descriptor =
        'proto_filename' in options
            ? await client.getDescriptorByFileName(options.proto_filename)
            : await client.getDescriptorBySymbol(options.proto_symbol);

    // Create package services
    return descriptor.getPackageObject(options.protoLoaderOptions) as T;
}