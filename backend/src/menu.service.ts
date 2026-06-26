import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ─── Category CRUD ────────────────────────────────────────────────────────

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    imageUrl?: string;
    sortOrder?: number;
    isVisible?: boolean;
  }) {
    const maxOrder = await this.prisma.category.aggregate({
      _max: { sortOrder: true },
    });
    return this.prisma.category.create({
      data: {
        ...data,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        isVisible: data.isVisible ?? true,
      },
      include: { _count: { select: { products: true } } },
    });
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      imageUrl?: string;
      sortOrder?: number;
      isVisible?: boolean;
    },
  ) {
    return this.prisma.category.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    });
  }

  async deleteCategory(id: string) {
    // Unlink products first
    await this.prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    return this.prisma.category.delete({ where: { id } });
  }

  async reorderCategories(items: { id: string; sortOrder: number }[]) {
    await Promise.all(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return this.getAllCategories();
  }

  // ─── Menu (Product) CRUD ──────────────────────────────────────────────────

  private menuInclude = {
    category: true,
    optionGroups: {
      orderBy: { sortOrder: 'asc' as const },
      include: { options: { orderBy: { sortOrder: 'asc' as const } } },
    },
    recipes: { include: { ingredient: true } },
    _count: { select: { orderItems: true } },
  };

  async getAllMenuItems(categoryId?: string) {
    return this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: this.menuInclude,
    });
  }

  async getMenuItemById(id: string) {
    const item = await this.prisma.product.findUnique({
      where: { id },
      include: this.menuInclude,
    });
    if (!item) throw new NotFoundException(`Menu item ${id} not found`);
    
    // Inject calculated cost
    (item as any).calculatedCost = this.calculateMenuCostLocal(item.recipes);
    return item;
  }

  private calculateMenuCostLocal(recipes: any[]): number {
    if (!recipes || recipes.length === 0) return 0;
    return recipes.reduce((total, r) => {
      const costPerUnit = r.ingredient?.costPerUnit || 0;
      return total + (r.quantity * costPerUnit);
    }, 0);
  }

  // Calculate and return cost for all menu items
  async getMenuCosting() {
    const items = await this.prisma.product.findMany({
      include: {
        category: true,
        recipes: { include: { ingredient: true } }
      }
    });

    return items.map(item => {
      const cogs = this.calculateMenuCostLocal(item.recipes);
      const profit = item.price - cogs;
      const margin = item.price > 0 ? (profit / item.price) * 100 : 0;
      
      return {
        ...item,
        cogs,
        profit,
        marginPercentage: margin
      };
    });
  }

  async createMenuItem(data: {
    name: string;
    description?: string;
    price: number;
    categoryId?: string;
    imageUrl?: string;
    status?: string;
    tags?: string[];
    sortOrder?: number;
  }) {
    const tagsJson = JSON.stringify(data.tags ?? []);
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        status: data.status ?? 'AVAILABLE',
        tags: tagsJson,
        sortOrder: data.sortOrder ?? 0,
      },
      include: this.menuInclude,
    });
  }

  async updateMenuItem(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      categoryId?: string;
      imageUrl?: string;
      status?: string;
      tags?: string[];
      sortOrder?: number;
    },
  ) {
    await this.getMenuItemById(id);
    const updateData: Prisma.ProductUpdateInput = {
      ...data,
      tags: data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
    };
    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: this.menuInclude,
    });
  }

  async toggleMenuStatus(id: string) {
    const item = await this.getMenuItemById(id);
    const nextStatus =
      item.status === 'AVAILABLE'
        ? 'OUT_OF_STOCK'
        : item.status === 'OUT_OF_STOCK'
          ? 'HIDDEN'
          : 'AVAILABLE';
    return this.prisma.product.update({
      where: { id },
      data: { status: nextStatus },
      include: this.menuInclude,
    });
  }

  async setMenuStatus(id: string, status: string) {
    await this.getMenuItemById(id);
    return this.prisma.product.update({
      where: { id },
      data: { status },
      include: this.menuInclude,
    });
  }

  async deleteMenuItem(id: string) {
    await this.getMenuItemById(id);
    // Delete option groups & options (cascade via relation delete)
    await this.prisma.menuOption.deleteMany({
      where: { group: { productId: id } },
    });
    await this.prisma.menuOptionGroup.deleteMany({ where: { productId: id } });
    await this.prisma.recipe.deleteMany({ where: { productId: id } });
    return this.prisma.product.delete({ where: { id } });
  }

  // ─── Option Groups ─────────────────────────────────────────────────────────

  async createOptionGroup(
    productId: string,
    data: {
      name: string;
      isRequired?: boolean;
      maxSelect?: number;
      sortOrder?: number;
    },
  ) {
    await this.getMenuItemById(productId);
    return this.prisma.menuOptionGroup.create({
      data: {
        productId,
        name: data.name,
        isRequired: data.isRequired ?? false,
        maxSelect: data.maxSelect ?? 1,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { options: true },
    });
  }

  async updateOptionGroup(
    groupId: string,
    data: {
      name?: string;
      isRequired?: boolean;
      maxSelect?: number;
      sortOrder?: number;
    },
  ) {
    return this.prisma.menuOptionGroup.update({
      where: { id: groupId },
      data,
      include: { options: true },
    });
  }

  async deleteOptionGroup(groupId: string) {
    await this.prisma.menuOption.deleteMany({ where: { groupId } });
    return this.prisma.menuOptionGroup.delete({ where: { id: groupId } });
  }

  // ─── Options ───────────────────────────────────────────────────────────────

  async createOption(
    groupId: string,
    data: {
      label: string;
      priceAddon?: number;
      isDefault?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.prisma.menuOption.create({
      data: {
        groupId,
        label: data.label,
        priceAddon: data.priceAddon ?? 0,
        isDefault: data.isDefault ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateOption(
    optionId: string,
    data: {
      label?: string;
      priceAddon?: number;
      isDefault?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.prisma.menuOption.update({ where: { id: optionId }, data });
  }

  async deleteOption(optionId: string) {
    return this.prisma.menuOption.delete({ where: { id: optionId } });
  }

  // ─── Recipe (ingredient linking) ──────────────────────────────────────────

  async addRecipe(productId: string, ingredientId: string, quantity: number) {
    return this.prisma.recipe.create({
      data: { productId, ingredientId, quantity },
      include: { ingredient: true },
    });
  }

  async updateRecipe(recipeId: string, quantity: number) {
    return this.prisma.recipe.update({
      where: { id: recipeId },
      data: { quantity },
      include: { ingredient: true },
    });
  }

  async deleteRecipe(recipeId: string) {
    return this.prisma.recipe.delete({ where: { id: recipeId } });
  }

  async getAllIngredients() {
    return this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
  }

  async createIngredient(data: { name: string; unit: string; costPerUnit?: number; sku?: string }) {
    return this.prisma.ingredient.create({
      data: {
        name: data.name,
        unit: data.unit,
        costPerUnit: data.costPerUnit || 0,
        sku: data.sku,
      }
    });
  }

  async updateIngredient(id: string, data: { name?: string; unit?: string; costPerUnit?: number; sku?: string }) {
    return this.prisma.ingredient.update({
      where: { id },
      data
    });
  }

  async deleteIngredient(id: string) {
    // Safety check: block if used in any recipe
    const recipeCount = await this.prisma.recipe.count({ where: { ingredientId: id } });
    if (recipeCount > 0) {
      throw new Error(`ไม่สามารถลบได้ — วัตถุดิบนี้ถูกใช้ในสูตร ${recipeCount} รายการ กรุณาลบออกจากสูตรก่อน`);
    }
    // Remove inventory records + transactions first, then the ingredient
    await this.prisma.$transaction([
      this.prisma.inventory.deleteMany({ where: { ingredientId: id } }),
      this.prisma.inventoryTransaction.deleteMany({ where: { ingredientId: id } }),
      this.prisma.ingredient.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  /** Returns all ingredients enriched with how many recipes use each one */
  async getAllIngredientsWithUsage() {
    const items = await this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { recipeItems: true, inventory: true } },
      },
    });
    return items.map((i) => ({
      ...i,
      recipeCount: i._count.recipeItems,
      inventoryCount: i._count.inventory,
    }));
  }
}
