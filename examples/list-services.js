const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');

/**
 * List services
 */
try {
    (async () => {
        const c = new GrpcReflection('0.0.0.0:50051', grpc.credentials.createInsecure());
        console.log(await c.listServices());
    })();

}catch(e){
    console.log(e);
}