import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

// Compose JWT + role check into a single decorator for compactness.
const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('ADMIN'));

@Controller('api')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ─── Categories ───────────────────────────────────────────────────────────
  @Get('categories')
  getCategories() {
    return this.menuService.getAllCategories();
  }

  @Post('categories')
  @AdminOnly()
  createCategory(@Body() body: Record<string, unknown>) {
    return this.menuService.createCategory(
      body as unknown as Parameters<typeof this.menuService.createCategory>[0],
    );
  }

  @Patch('categories/reorder')
  @AdminOnly()
  reorderCategories(
    @Body() body: { items: { id: string; sortOrder: number }[] },
  ) {
    return this.menuService.reorderCategories(body.items);
  }

  @Patch('categories/:id')
  @AdminOnly()
  updateCategory(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.menuService.updateCategory(
      id,
      body as unknown as Parameters<typeof this.menuService.updateCategory>[1],
    );
  }

  @Delete('categories/:id')
  @AdminOnly()
  @HttpCode(200)
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // ─── Menu items ───────────────────────────────────────────────────────────
  @Get('menu')
  getMenu(@Query('categoryId') categoryId?: string) {
    return this.menuService.getAllMenuItems(categoryId);
  }

  @Get('menu/ingredients')
  getMenuIngredients() {
    return this.menuService.getAllIngredients();
  }

  @Get('menu/costing')
  @AdminOnly()
  getMenuCosting() {
    return this.menuService.getMenuCosting();
  }

  @Get('menu/:id')
  getMenuItem(@Param('id') id: string) {
    return this.menuService.getMenuItemById(id);
  }

  @Post('menu')
  @AdminOnly()
  createMenuItem(@Body() body: Record<string, unknown>) {
    return this.menuService.createMenuItem(
      body as unknown as Parameters<typeof this.menuService.createMenuItem>[0],
    );
  }

  @Patch('menu/:id')
  @AdminOnly()
  updateMenuItem(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.menuService.updateMenuItem(
      id,
      body as unknown as Parameters<typeof this.menuService.updateMenuItem>[1],
    );
  }

  @Delete('menu/:id')
  @AdminOnly()
  @HttpCode(200)
  deleteMenuItem(@Param('id') id: string) {
    return this.menuService.deleteMenuItem(id);
  }

  @Patch('menu/:id/status')
  @AdminOnly()
  setMenuStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.menuService.setMenuStatus(id, status);
  }

  @Post('menu/:id/recipes')
  @AdminOnly()
  addRecipe(
    @Param('id') id: string,
    @Body() body: { ingredientId: string; quantity: number },
  ) {
    return this.menuService.addRecipe(id, body.ingredientId, body.quantity);
  }

  // ─── Option groups ────────────────────────────────────────────────────────
  @Post('menu/:id/option-groups')
  @AdminOnly()
  createOptionGroup(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.menuService.createOptionGroup(
      id,
      body as unknown as Parameters<typeof this.menuService.createOptionGroup>[1],
    );
  }

  @Patch('menu/option-groups/:groupId')
  @AdminOnly()
  updateOptionGroup(
    @Param('groupId') groupId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.menuService.updateOptionGroup(
      groupId,
      body as unknown as Parameters<typeof this.menuService.updateOptionGroup>[1],
    );
  }

  @Delete('menu/option-groups/:groupId')
  @AdminOnly()
  @HttpCode(200)
  deleteOptionGroup(@Param('groupId') groupId: string) {
    return this.menuService.deleteOptionGroup(groupId);
  }

  // ─── Options ──────────────────────────────────────────────────────────────
  @Post('menu/option-groups/:groupId/options')
  @AdminOnly()
  createOption(
    @Param('groupId') groupId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.menuService.createOption(
      groupId,
      body as unknown as Parameters<typeof this.menuService.createOption>[1],
    );
  }

  @Patch('menu/options/:optionId')
  @AdminOnly()
  updateOption(
    @Param('optionId') optionId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.menuService.updateOption(
      optionId,
      body as unknown as Parameters<typeof this.menuService.updateOption>[1],
    );
  }

  @Delete('menu/options/:optionId')
  @AdminOnly()
  @HttpCode(200)
  deleteOption(@Param('optionId') optionId: string) {
    return this.menuService.deleteOption(optionId);
  }

  // ─── Legacy /products routes (used by buyer-liff + admin-hq InventoryLedger)
  @Get('products')
  getProducts() {
    return this.menuService.getAllMenuItems();
  }

  @Get('products/ingredients')
  getIngredients() {
    return this.menuService.getAllIngredients();
  }

  @Get('products/ingredients/usage')
  getIngredientsUsage() {
    return this.menuService.getAllIngredientsWithUsage();
  }

  @Post('products/ingredients')
  @AdminOnly()
  createIngredient(@Body() body: Record<string, unknown>) {
    return this.menuService.createIngredient(
      body as unknown as Parameters<typeof this.menuService.createIngredient>[0],
    );
  }

  @Patch('products/ingredients/:id')
  @AdminOnly()
  updateIngredient(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.menuService.updateIngredient(
      id,
      body as unknown as Parameters<typeof this.menuService.updateIngredient>[1],
    );
  }

  @Delete('products/ingredients/:id')
  @AdminOnly()
  @HttpCode(200)
  deleteIngredient(@Param('id') id: string) {
    return this.menuService.deleteIngredient(id);
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.menuService.getMenuItemById(id);
  }

  @Post('products/:id/recipes')
  @AdminOnly()
  addRecipeLegacy(
    @Param('id') id: string,
    @Body() body: { ingredientId: string; quantity: number },
  ) {
    return this.menuService.addRecipe(id, body.ingredientId, body.quantity);
  }

  @Patch('recipes/:recipeId')
  @AdminOnly()
  updateRecipeLegacy(
    @Param('recipeId') recipeId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.menuService.updateRecipe(recipeId, quantity);
  }

  @Delete('recipes/:recipeId')
  @AdminOnly()
  @HttpCode(200)
  deleteRecipeLegacy(@Param('recipeId') recipeId: string) {
    return this.menuService.deleteRecipe(recipeId);
  }
}
