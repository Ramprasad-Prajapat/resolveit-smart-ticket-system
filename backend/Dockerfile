# Stage 1: Build JAR
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline || true
COPY src ./src
RUN mvn -B -DskipTests package

# Stage 2: Minimal Runtime JRE
FROM eclipse-temurin:21-jre
RUN useradd -u 1001 -m appuser
WORKDIR /app
COPY --from=build /app/target/resolveit-backend-1.0.0.jar /app/app.jar
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-XX:+UseSerialGC", "-jar", "/app/app.jar"]
