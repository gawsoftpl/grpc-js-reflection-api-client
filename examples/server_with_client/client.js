const { GrpcReflection } = require('../../dist/index');
const grpc =  require('@grpc/grpc-js');

/**
 * Get proto descriptor from reflection grpc api and get in @grpc/grpc-js format
 *
 * */

const host = "127.0.0.1:3000"

try {
    (async()=>{
        // Connect with grpc server reflection
        const client = new GrpcReflection(host, grpc.ChannelCredentials.createInsecure());

        // Get services without proto file for specific symbol or file name
        const descriptor = await client.getDescriptorByFileName('addressbook.proto');

        // Create package services
        const packageObject = descriptor.getPackageObject({
            keepCase: true,
            enums: String,
            longs: String
        });

        // Send request over grpc
        const proto = new packageObject.addressbook.AddressesService(
            host,
            grpc.ChannelCredentials.createInsecure(),
        );

        proto.Add({
            name: "abc",
            email: "test@example.com"
        },(err,data)=>{
            if(err) {
                console.log(err);
            }else{
                console.log(data);
            }
        });

    })();
}catch(e){
    console.log(e);
}