generate-python-tests-proto:
	cd tests/e2e/python-grpc-reflection-server && python -m grpc_tools.protoc -I../../protos --python_out=. --pyi_out=. --grpc_python_out=. ../../protos/helloworld.proto