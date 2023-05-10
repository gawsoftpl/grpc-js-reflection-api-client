//import { GrpcReflection } from 'grpc-js-reflection-client';
import { GrpcReflection } from '../src/GrpcReflection';
import * as grpc from '@grpc/grpc-js';

/**
 * Get proto descriptor from reflection grpc api and get in @grpc/grpc-js format
 *
 * */
try {
    (async () => {
        const client = new GrpcReflection('0.0.0.0:3000', grpc.credentials.createInsecure());

        // Find protobufjs descriptor by symbol in grpc reflection server
        const descriptor = await client.getDescriptorBySymbol('apidata');

        // Get @grpc/grpc-js package object
        const packageObject = descriptor.getPackageObject({
            keepCase: true,
            enums: String,
            longs: String
        });

        // Connect with service packageObject.<packageName>.<serviceName>
        //@ts-ignore
        var proto = new packageObject.apidata.ApiKeyService(
            '0.0.0.0:3000',
            grpc.credentials.createInsecure()
        );

        // Optional add metadata do query
        var metadata = new grpc.Metadata();
        metadata.add('authorization', "abc");

        // Execute rpc command
        proto.Add({"user_id":"A"}, metadata, (d)=>{
            console.log(d);
        });

        proto.Add({"user_id":"A"}, metadata, (d)=>{
            console.log(d);
        });

    })();

}catch(e){
    console.log(e);
}
