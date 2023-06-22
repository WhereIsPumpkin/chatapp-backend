import SwaggerUI from "swagger-ui-express";
import YAML from "yamljs";

const options = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Chat App",
};

const swaggerDocument = YAML.load("./config/swagger.yaml");
export default [SwaggerUI.serve, SwaggerUI.setup(swaggerDocument, options)];
