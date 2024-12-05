# remote-grpc

## StreamService

The StreamService is a TypeScript class that provides methods to create server and client instances for communication between services. It has a constructor, several properties and two main methods: makeServer() and makeClient().

The protoService and loggerService properties are instances of other classes used for service communication and logging, respectively. The _makeServerInternal() and _makeClientInternal() methods are internal helper functions used to create server and client instances with customizable options.

The makeServer() method creates a server instance for communication between services, taking the service name and a connector function as parameters. The makeClient() method creates a client instance for communication between services, also taking the service name and a connector function as parameters. Both methods return a SendMessageFn, which can be used to send messages between services.

## ProtoService

ProtoService is a TypeScript class that provides functionality for managing gRPC services. It has a constructor, properties like loggerService and _protoMap, as well as methods loadProto and makeClient. The class allows for creating gRPC clients and servers using the specified service names, such as "FooService", "BarService", "BazService" or "MessageService". The loadProto method loads the specified proto file and returns a GrpcObject, while the makeClient method creates a client for the specified service. The makeServer method creates a server for the specified service using a provided connector.

## LoggerService

The LoggerService is a TypeScript class that provides logging functionality. It has a constructor which initializes the `_logger` property, and two methods: `log()` and `setPrefix()`. 

The `_logger` property is a variable that stores the logging instance, and it is initialized in the constructor. The `log()` method is used to log messages with optional arguments. The `setPrefix()` method is used to set a custom prefix for the log messages.

## ErrorService

The `ErrorService` is a TypeScript class that handles errors globally within the application. It has a constructor that initializes the service and two properties: `handleGlobalError` and `_listenForError`. 

The `handleGlobalError` property is a function that takes an `Error` object as input and returns `never`. This function is responsible for handling global errors that occur in the application.

The `_listenForError` property is a variable that listens for errors in the application. It is of type `any`, which means it can hold any value or type.

The `init` property is a function that initializes the `ErrorService`. When called, it sets up the error handling mechanism within the application.
