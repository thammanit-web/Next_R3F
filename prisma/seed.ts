import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


async function main() {
    console.log('🌱 Seeding database...')


    // Create deck assets
    const decks = [
        { kind: 'DECK', uid: 'deck-01', url: '/uploads/deck-01.png' },
        { kind: 'DECK', uid: 'deck-02', url: '/uploads/deck-02.png' },
        { kind: 'DECK', uid: 'deck-03', url: '/uploads/deck-03.png' }
    ]


    // Create wheel assets
    const wheels = [
        { kind: 'WHEEL', uid: 'wheel-01', url: '/uploads/wheel-01.png' },
        { kind: 'WHEEL', uid: 'wheel-02', url: '/uploads/wheel-02.png' }
    ]


    for (const a of [...decks, ...wheels]) {
        await prisma.asset.upsert({
            where: { kind_uid: { kind: a.kind as any, uid: a.uid } },
            update: { url: a.url },
            create: {
                kind: a.kind as any, 
                uid: a.uid,
                url: a.url
            }
        })
    }


    const user = await prisma.user.upsert({
        where: { email: 'demo@skateshop.local' },
        update: {},
        create: { email: 'demo@skateshop.local', name: 'Demo User' }
    })


    await prisma.design.create({
        data: {
            customerEmail: 'demo@skateshop.local',
            deckUid: 'deck-01',
            deckUrl: '/uploads/deck-01.png',
            wheelUid: 'wheel-01',
            wheelUrl: '/uploads/wheel-01.png',
            truckColor: '#6F6E6A',
            boltColor: '#000000',
            userId: user.id,
            status: 'SUBMITTED'
        }
    })


    console.log('✅ Seed completed')
}


main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })