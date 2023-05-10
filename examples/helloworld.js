const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

/**
 * Get proto descriptor from reflection grpc api and get in @grpc/grpc-js format
 *
 * */
try {
    (async()=>{
        // Connect with grpc server reflection
        const client = new GrpcReflection('0.0.0.0:50051', grpc.credentials.createInsecure());

        // Get services without proto file for specific symbol or file name
        const descriptor = await client.getDescriptorBySymbol('helloworld.Greeter');
        //const descriptor = await client.getDescriptorByFileName('examples/helloworld/helloworld/helloworld.proto');

        // Create package services
        const packageObject = descriptor.getPackageObject({
            keepCase: true,
            enums: String,
            longs: String
        });

        // Send request over grpc
        const proto = new packageObject.helloworld.Greeter(
            "localhost:50051",
            grpc.credentials.createInsecure(),
        );

        proto.SayHello({
            name: "abc"
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
