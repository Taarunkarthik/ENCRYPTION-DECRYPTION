# Stage 1: Maven build
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/encryption-decryption-backend-1.0.0.jar app.jar

ENV SERVER_PORT=8080
EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
