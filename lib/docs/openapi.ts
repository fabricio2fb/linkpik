import { z } from "zod";
import { TrackEventSchema } from "@/lib/schemas/analytics.schema";
import { UpdateCreatorSchema } from "@/lib/schemas/creator.schema";
import { CreateOrderSchema } from "@/lib/schemas/order.schema";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/schemas/product.schema";

function jsonSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema);
}

export function generateOpenApiSpec() {
  const components = {
    schemas: {
      CreateProduct: jsonSchema(CreateProductSchema),
      UpdateProduct: jsonSchema(UpdateProductSchema),
      CreateOrder: jsonSchema(CreateOrderSchema),
      UpdateCreator: jsonSchema(UpdateCreatorSchema),
      TrackEvent: jsonSchema(TrackEventSchema),
    },
  };

  return {
    openapi: "3.0.0",
    info: {
      title: "Pikbio API",
      version: "1.0.0",
    },
    servers: [{ url: process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio" }],
    components,
    paths: {
      "/api/orders": {
        post: {
          summary: "Criar pedido (checkout)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateOrder" },
              },
            },
          },
          responses: {
            200: { description: "Pedido criado com checkout_url do Mercado Pago" },
            400: { description: "Dados invalidos" },
            404: { description: "Produto nao encontrado" },
            429: { description: "Rate limit excedido" },
          },
        },
      },
      "/api/products": {
        post: {
          summary: "Criar produto (autenticado)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateProduct" },
              },
            },
          },
          responses: {
            201: { description: "Produto criado" },
            400: { description: "Dados invalidos" },
            401: { description: "Nao autenticado" },
          },
        },
      },
      "/api/creators/{username}": {
        get: {
          summary: "Buscar loja publica do creator",
          parameters: [
            {
              name: "username",
              in: "path",
              required: true,
              schema: jsonSchema(z.string()),
            },
          ],
          responses: {
            200: { description: "Creator e produtos ativos" },
            404: { description: "Loja nao encontrada" },
          },
        },
      },
    },
  };
}
