# ---------- build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline -q
COPY src ./src
RUN mvn -B package -DskipTests -q

# ---------- runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r appuser
USER appuser
COPY --from=build /app/target/hotel-erp.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
