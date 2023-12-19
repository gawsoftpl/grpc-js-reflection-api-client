import {DescriptorServiceHelperOptions, packageObjectHelper} from "./packageObjectHelper";

export type ServiceHelperOptionsType = {
    servicePath: string
} & DescriptorServiceHelperOptions;

/**
 * Helper for create grpc service from grpc reflection server in one line:
 * In servicePath attribute use path to your service in packageObject with dot as separator like: addressbook.AddressesService
 * {
 *     host: "127.0.0.1:3000",
 *     credentials: grpc.ChannelCredentia,
 *     proto_filename: "addressbook.proto",
 *     servicePath: "addressbook.AddressesService",
 *     protoLoaderOptions: {
 *       keepCase: true,
 *       enums: String,
 *       longs: String
 *     }
 * }
 * @param options
 */
export const serviceHelper = async<T>(options: ServiceHelperOptionsType): Promise<T> => {

    const packageObject = await packageObjectHelper(options);

    const pathToService = options.servicePath.split('.');
    let service: any = packageObject;
    let concatenatePath = [];
    do {
        const servicePath = pathToService.shift();
        concatenatePath.push(servicePath);
        if (!(servicePath in service)) throw new Error(`Wrong servicePath ${concatenatePath.join('.')} do not exists in packageObject. Try method: listServices in GrpcReflection class to list all services in grpc server`);
        service = service[servicePath];
    }while(pathToService.length > 0);

    // Send request over grpc
    return new service(
        options.host,
        options.credentials,
    );
}