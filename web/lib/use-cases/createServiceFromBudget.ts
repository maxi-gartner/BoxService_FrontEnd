import type { Budget, Service, ServiceCreateRequest, ServiceDetailCreateRequest } from "@/types/entities";

type CreateServiceFromBudgetInput = {
  budget: Pick<Budget, "budgetId" | "vehicleId" | "number">;
  mileage: number;
  descriptions: string[];
};

type CreateServiceFromBudgetOperations = {
  createService: (data: ServiceCreateRequest) => Promise<Pick<Service, "serviceId">>;
  createServiceDetail: (input: { serviceId: number; data: ServiceDetailCreateRequest }) => Promise<unknown>;
  assignService: (input: { budgetId: number; serviceId: number }) => Promise<unknown>;
};

export async function createServiceFromBudget(
  { budget, mileage, descriptions }: CreateServiceFromBudgetInput,
  { createService, createServiceDetail, assignService }: CreateServiceFromBudgetOperations,
): Promise<void> {
  const service = await createService({
    vehicleId: budget.vehicleId,
    date: new Date().toISOString().slice(0, 10),
    mileage,
    serviceType: "Service desde presupuesto",
    notes: `Generado desde presupuesto ${budget.number}.`,
  });

  for (const description of descriptions) {
    await createServiceDetail({ serviceId: service.serviceId, data: { description, done: true } });
  }

  await assignService({ budgetId: budget.budgetId, serviceId: service.serviceId });
}
