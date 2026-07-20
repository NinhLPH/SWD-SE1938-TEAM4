const User = require('./User');
const Shop = require('./Shop');
const Category = require('./Category');
const Product = require('./Product');
const Cart = require('./Cart');
const Order = require('./Order');
const Payment = require('./Payment');

const CartItem = Cart.CartItem;
const OrderItem = Order.OrderItem;
const relationOptions = { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' };

User.hasMany(Shop, { foreignKey: 'ownerId', as: 'shops', ...relationOptions });
Shop.belongsTo(User, { foreignKey: 'ownerId', as: 'owner', ...relationOptions });

Shop.hasMany(Product, { foreignKey: 'shopId', as: 'products', ...relationOptions });
Product.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop', ...relationOptions });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category', ...relationOptions });
Product.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy', ...relationOptions });

User.hasOne(Cart, { foreignKey: 'userId', as: 'cart', ...relationOptions });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'userRecord', ...relationOptions });
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', ...relationOptions });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart', ...relationOptions });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product', ...relationOptions });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders', ...relationOptions });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user', ...relationOptions });
Shop.hasMany(Order, { foreignKey: 'shopId', as: 'orders', ...relationOptions });
Order.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop', ...relationOptions });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', ...relationOptions });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order', ...relationOptions });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product', ...relationOptions });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments', ...relationOptions });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user', ...relationOptions });

module.exports = {
  User,
  Shop,
  Category,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
};
