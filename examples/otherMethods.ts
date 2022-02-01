//import { GrpcReflection } from 'grpc-js-reflection-client';
import { GrpcReflection } from '../src/GrpcReflection';
import * as grpc from '@grpc/grpc-js';

/**
 * Other methods to use
 * */
try {
    (async () => {
        const c = new GrpcReflection('0.0.0.0:3000', grpc.credentials.createInsecure());

        // Find protobufjs descriptor by symbol in grpc reflection server
        const descriptor = await c.getDescriptorBySymbol('apidata');

        // Packagejs descriptor
        const descriptorMessage = descriptor.getDescriptorMessage();
        console.log(descriptorMessage);

        // Package definition
        const packageDefinition = descriptor.getPackageDefinition({
            keepCase: true,
            enums: String
        });
        //console.log(packageDefinition);

        // Get protobufer descriptor
        const buffer = descriptor.getBuffer();
        //console.log(buffer);

    })();

}catch(e){
    console.log(e);
}