"""
Seed script to populate database with initial data.
Creates: 1 Admin, 10 Sellers, 5 Accountants, 5 Warehouse, 5 Shippers, 100 Products, 100 Customers
"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User, Role, Permission, user_roles, role_permissions
from app.models.product import Product, Category
from app.models.customer import Customer
from app.core.security import get_password_hash
import uuid


async def seed_database():
    """Seed the database with initial data."""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("Creating roles...")
        # Create roles
        admin_role = Role(name="ADMIN", description="System Administrator")
        seller_role = Role(name="SELLER", description="Sales Representative")
        accountant_role = Role(name="ACCOUNTANT", description="Accounting Manager")
        warehouse_role = Role(name="WAREHOUSE", description="Warehouse Operator")
        shipper_role = Role(name="SHIPPER", description="Shipping Coordinator")

        session.add_all([admin_role, seller_role, accountant_role, warehouse_role, shipper_role])
        await session.flush()

        print("Creating permissions...")
        # Create basic permissions
        permissions = [
            Permission(code="products:create", name="Create Products"),
            Permission(code="products:read", name="View Products"),
            Permission(code="products:update", name="Update Products"),
            Permission(code="products:delete", name="Delete Products"),
            Permission(code="customers:create", name="Create Customers"),
            Permission(code="customers:read", name="View Customers"),
            Permission(code="orders:create", name="Create Orders"),
            Permission(code="orders:approve", name="Approve Orders"),
        ]
        session.add_all(permissions)
        await session.flush()

        # Assign permissions to roles
        admin_permissions = permissions  # Admin gets all
        for perm in admin_permissions:
            stmt = role_permissions.insert().values(role_id=admin_role.id, permission_id=perm.id)
            await session.execute(stmt)

        print("Creating admin user...")
        # Create admin user
        admin = User(
            email="admin@b2bsales.com",
            password_hash=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            mobile="+989123456789",
            is_active=True,
        )
        admin.roles.append(admin_role)
        session.add(admin)
        await session.flush()

        print("Creating 10 sellers...")
        # Create sellers
        sellers = []
        for i in range(1, 11):
            seller = User(
                email=f"seller{i}@b2bsales.com",
                password_hash=get_password_hash(f"seller{i}123"),
                first_name=f"Seller",
                last_name=f"{i}",
                mobile=f"+9891234567{str(i).zfill(2)}",
                is_active=True,
            )
            seller.roles.append(seller_role)
            session.add(seller)
            sellers.append(seller)
        await session.flush()

        print("Creating accountants, warehouse, and shippers...")
        # Create accountants
        for i in range(1, 6):
            user = User(
                email=f"accountant{i}@b2bsales.com",
                password_hash=get_password_hash(f"acct{i}123"),
                first_name=f"Accountant",
                last_name=f"{i}",
                mobile=f"+9891234568{str(i).zfill(2)}",
                is_active=True,
            )
            user.roles.append(accountant_role)
            session.add(user)

        # Create warehouse staff
        for i in range(1, 6):
            user = User(
                email=f"warehouse{i}@b2bsales.com",
                password_hash=get_password_hash(f"wh{i}123"),
                first_name=f"Warehouse",
                last_name=f"{i}",
                mobile=f"+9891234569{str(i).zfill(2)}",
                is_active=True,
            )
            user.roles.append(warehouse_role)
            session.add(user)

        # Create shippers
        for i in range(1, 6):
            user = User(
                email=f"shipper{i}@b2bsales.com",
                password_hash=get_password_hash(f"ship{i}123"),
                first_name=f"Shipper",
                last_name=f"{i}",
                mobile=f"+9891234570{str(i).zfill(2)}",
                is_active=True,
            )
            user.roles.append(shipper_role)
            session.add(user)

        await session.flush()

        print("Creating categories...")
        # Create categories
        categories = [
            Category(name="Electronics", description="Electronic devices and accessories"),
            Category(name="Clothing", description="Apparel and fashion items"),
            Category(name="Food & Beverages", description="Food products and drinks"),
            Category(name="Office Supplies", description="Office equipment and supplies"),
            Category(name="Industrial", description="Industrial equipment and materials"),
        ]
        session.add_all(categories)
        await session.flush()

        print("Creating 100 products...")
        # Create products
        products = []
        product_names = [
            "Laptop Pro 15", "Wireless Mouse", "USB-C Hub", "Mechanical Keyboard",
            "Monitor 27 inch", "Webcam HD", "Headset Pro", "Desk Lamp LED",
            "Cotton T-Shirt", "Denim Jeans", "Running Shoes", "Winter Jacket",
            "Coffee Beans 1kg", "Green Tea Box", "Energy Drink Pack", "Protein Bars",
            "Printer Paper A4", "Ink Cartridge", "Stapler Heavy Duty", "Whiteboard Markers",
            "Power Drill", "Safety Goggles", "Work Gloves", "Tool Set 50pc",
        ]

        for i in range(1, 101):
            category = categories[(i - 1) % len(categories)]
            product = Product(
                sku=f"PROD-{str(i).zfill(4)}",
                name=f"{product_names[(i-1) % len(product_names)]} {i}",
                description=f"High-quality product number {i}",
                category_id=category.id,
                unit_price=50 + (i * 10.5),
                unit="piece",
                minimum_order_quantity=1,
                stock_quantity=100 - (i % 20),
                status="active",
                created_by=admin.id,
            )
            products.append(product)

        session.add_all(products)
        await session.flush()

        print("Creating 100 customers...")
        # Create customers distributed among sellers
        for i in range(1, 101):
            owner = sellers[(i - 1) % len(sellers)]
            customer = Customer(
                first_name=f"Customer",
                last_name=f"{i}",
                mobile=f"+98935{str(i).zfill(7)}",
                company_name=f"Company {i} Ltd",
                national_id=f"123456789{i % 10}",
                economic_id=f"987654321{i % 10}",
                owner_id=owner.id,
                notes=f"VIP customer #{i}",
            )
            session.add(customer)

        await session.commit()

        print("\n✓ Seed data created successfully!")
        print(f"  - 1 Admin (admin@b2bsales.com / admin123)")
        print(f"  - 10 Sellers (seller1-10@b2bsales.com / seller1-10123)")
        print(f"  - 5 Accountants")
        print(f"  - 5 Warehouse staff")
        print(f"  - 5 Shippers")
        print(f"  - 5 Categories")
        print(f"  - 100 Products")
        print(f"  - 100 Customers")


if __name__ == "__main__":
    asyncio.run(seed_database())
