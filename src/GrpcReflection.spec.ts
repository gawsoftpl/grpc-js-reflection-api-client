import { GrpcReflection } from './GrpcReflection';
import * as grpc from '@grpc/grpc-js';
import { ReflectionRequestException } from './Exceptions';
import { EventEmitter } from 'events';

// 1. Mock the stream object returned by client.ServerReflectionInfo()
class MockClientStream extends EventEmitter {
    write = jest.fn();
    end = jest.fn();
}

let mockStream: MockClientStream;
const mockServerReflectionInfo = jest.fn();

// 2. Mock the generated Proto files
jest.mock('./Proto/v1alpha', () => ({
    grpc: {
        reflection: {
            v1alpha: {
                ServerReflectionClient: jest.fn().mockImplementation(() => ({
                    ServerReflectionInfo: mockServerReflectionInfo,
                })),
                ServerReflectionRequest: {
                    fromObject: jest.fn((data) => data),
                },
            },
        },
    },
}));

jest.mock('./Proto/v1', () => ({
    grpc: {
        reflection: {
            v1: {
                ServerReflectionClient: jest.fn().mockImplementation(() => ({
                    ServerReflectionInfo: mockServerReflectionInfo,
                })),
                ServerReflectionRequest: {
                    fromObject: jest.fn((data) => data),
                },
            },
        },
    },
}));

describe('GrpcReflection', () => {
    let reflection: GrpcReflection;
    const mockHost = 'localhost:50051';
    const mockCredentials = grpc.credentials.createInsecure();

    beforeEach(() => {
        jest.clearAllMocks();
        mockStream = new MockClientStream();
        mockServerReflectionInfo.mockReturnValue(mockStream);
    });

    describe('Constructor & Initialization', () => {
        it('should initialize with v1alpha by default', () => {
            reflection = new GrpcReflection(mockHost, mockCredentials);
            expect(reflection['version']).toBe('v1alpha');
        });

        it('should initialize with v1 when specified', () => {
            reflection = new GrpcReflection(mockHost, mockCredentials, {}, 'v1');
            expect(reflection['version']).toBe('v1');
        });

        it('should throw ReflectionRequestException for unsupported versions', () => {
            expect(() => {
                new GrpcReflection(mockHost, mockCredentials, {}, 'v2');
            }).toThrow(ReflectionRequestException);
            expect(() => {
                new GrpcReflection(mockHost, mockCredentials, {}, 'v2');
            }).toThrow('Unknown proto version available: [v1, v1alpha]');
        });
    });

    describe('Reflection Requests (Stream handling)', () => {
        beforeEach(() => {
            reflection = new GrpcReflection(mockHost, mockCredentials);
        });

        it('should list services successfully', async () => {
            // Setup the promise
            const promise = reflection.listServices();

            // Simulate the gRPC server responding with data
            mockStream.emit('data', {
                listServicesResponse: {
                    service: [{ name: 'ServiceA' }, { name: 'ServiceB' }],
                },
            });

            const result = await promise;

            expect(mockServerReflectionInfo).toHaveBeenCalled();
            expect(mockStream.write).toHaveBeenCalledWith({ listServices: '*' });
            expect(result).toEqual(['ServiceA', 'ServiceB']);
        });

        it('should get all extension numbers of type successfully', async () => {
            const promise = reflection.getAllExtensionNumbersOfType('my.package.MyType');

            mockStream.emit('data', {
                allExtensionNumbersResponse: {
                    baseTypeName: 'my.package.MyType',
                    extensionNumber: [100, 101],
                },
            });

            const result = await promise;

            expect(mockStream.write).toHaveBeenCalledWith({ allExtensionNumbersOfType: 'my.package.MyType' });
            expect(result).toEqual({
                base_type_name: 'my.package.MyType',
                extension_number: [100, 101],
            });
        });

        it('should handle gRPC stream errors and throw ReflectionRequestException', async () => {
            const promise = reflection.listServices();

            // Simulate a network or stream error
            mockStream.emit('error', new Error('Stream failed'));

            await expect(promise).rejects.toThrow(ReflectionRequestException);
        });

        it('should handle error responses inside the data payload', async () => {
            const promise = reflection.listServices();

            // Simulate the reflection server returning an application-level error
            mockStream.emit('data', {
                errorResponse: {
                    errorMessage: 'Symbol not found',
                },
            });

            await expect(promise).rejects.toThrow(ReflectionRequestException);
            await expect(promise).rejects.toThrow('Symbol not found');
        });

        it('should successfully pass metadata and options through the real client interface', async () => {
            // Arrange
            const mockMetadata = new grpc.Metadata();
            mockMetadata.add('Authorization', 'Bearer real-token-xyz');

            const mockOptions: grpc.CallOptions = {
                deadline: new Date(Date.now() + 5000)
            };

            // Act
            const promise = reflection.listServices('*', mockMetadata, mockOptions);

            // Asserting the stream handling: push a real-looking proto-compliant object
            mockStream.emit('data', {
                listServicesResponse: {
                    service: [{ name: 'real.package.UserService' }]
                }
            });

            const result = await promise;

            // Assert
            expect(result).toEqual(['real.package.UserService']);

            // Verify the real method spy received the exact gRPC Metadata and CallOptions instances
            expect(reflection['client'].ServerReflectionInfo).toHaveBeenCalledWith(
                mockMetadata,
                mockOptions
            );
        });

        it('should write data to the stream using only options against metadata', async () => {

            const mockOptions: grpc.CallOptions = {
                deadline: new Date(Date.now() + 5000)
            };

            // Arrange
            const promise = reflection.listServices('test-prefix', mockOptions);

            // Act
            mockStream.emit('data', { listServicesResponse: { service: [] } });
            await promise;

            expect(reflection['client'].ServerReflectionInfo).toHaveBeenCalledWith(
                mockOptions,
                undefined
            );
            expect(mockStream.write).toHaveBeenCalled();
        });

        it('should write data to the stream using the real reflectionRequestConstructor', async () => {
            const mockMetadata = new grpc.Metadata();
            mockMetadata.add('dummy-meta', 'dummy-value');

            // Arrange
            const promise = reflection.listServices('test-prefix', mockMetadata);

            // Act
            mockStream.emit('data', { listServicesResponse: { service: [] } });
            await promise;

            expect(reflection['client'].ServerReflectionInfo).toHaveBeenCalledWith(
                mockMetadata,
                undefined,
            );
            expect(mockStream.write).toHaveBeenCalled();
        });
    });

    describe('Utility Methods', () => {
        beforeEach(() => {
            reflection = new GrpcReflection(mockHost, mockCredentials);
        });

        it('should generate service paths correctly', () => {
            // Accessing protected method for testing via casting
            const path = (reflection as any).generateServicePath('my.package.MyService');
            expect(path).toEqual(['MyService', 'package', 'my']);
        });

        it('should extract service methods correctly from a valid descriptor object', () => {
            const mockDescriptor = {
                my: {
                    package: {
                        MyService: {
                            service: {
                                GetData: { requestType: 'DataRequest', responseType: 'DataResponse' },
                                SetData: { requestType: 'DataRequest', responseType: 'DataResponse' },
                            },
                        },
                    },
                },
            };

            const methods = reflection.getServiceMethods(mockDescriptor as any, 'my.package.MyService');

            expect(methods).toHaveLength(2);
            expect(methods[0].name).toBe('GetData');
            expect(methods[1].name).toBe('SetData');
        });

        it('should throw ReflectionRequestException if service is not found in descriptor', () => {
            const mockDescriptor = {
                my: { package: {} }, // Missing 'MyService'
            };

            expect(() => {
                reflection.getServiceMethods(mockDescriptor as any, 'my.package.MyService');
            }).toThrow(ReflectionRequestException);
            expect(() => {
                reflection.getServiceMethods(mockDescriptor as any, 'my.package.MyService');
            }).toThrow('Not found service');
        });
    });
});
