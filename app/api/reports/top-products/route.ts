
// app/api/reports/top-products/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export async function GET() {
  try {
    const startDate = subDays(new Date(), 30)

    // Get top selling products by quantity
    const topSellingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
          },
          status: {
            not: 'CANCELLED',
          },
        },
      },
      _sum: {
        quantity: true,
      },
      take: 5,
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
    })

    // Get product details for top selling products
    const topSelling = await Promise.all(
      topSellingProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })
        return {
          name: product?.name,
          quantity: item._sum.quantity,
        }
      })
    )

    // Get top products by revenue
    const topRevenueProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
          },
          status: {
            not: 'CANCELLED',
          },
        },
      },
      _sum: {
        quantity: true,
        price: true,
      },
      take: 5,
      orderBy: {
        _sum: {
          price: 'desc',
        },
      },
    })

    // Get product details for top revenue products
    const topRevenue = await Promise.all(
      topRevenueProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })
        return {
          name: product?.name,
          revenue: (item._sum.price || 0) * (item._sum.quantity || 0),
        }
      })
    )

    return NextResponse.json({
      selling: topSelling,
      revenue: topRevenue,
    })
  } catch (error) {
    console.error('Failed to fetch top products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top products' },
      { status: 500 }
    )
  }
}