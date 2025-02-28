# FlashCatch

FlashCatch is an interactive web application that visualizes the speed difference between traditional 2-second blocks and 200-millisecond Flashblocks on Base Sepolia through an engaging, game-like experience.

## Features

- **Interactive Game**: Catch falling blocks representing real blockchain data
- **Visual Distinction**: Clear visual difference between standard blocks (blue) and Flashblocks (orange)
- **Real-time Blockchain Data**: Connection to Base Sepolia endpoints for live block data
- **Transaction Submission**: Submit test transactions and see confirmation time differences
- **Educational Elements**: Learn about Flashblocks technology while playing

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Animation**: Framer Motion
- **Blockchain Integration**: ethers.js, WebSocket API
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/flashcatch.git
   cd flashcatch
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Run the development server:

   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

1. **Catch Blocks**: Move the catcher at the bottom of the screen to catch falling blocks
2. **Score Points**: Earn points for each block caught (standard blocks are worth more)
3. **Submit Transactions**: Try submitting a test transaction to see how much faster it confirms in Flashblocks
4. **Track Stats**: Watch the stats dashboard to see real-time metrics

## Blockchain Integration

FlashCatch connects to two Base Sepolia endpoints:

- **Standard Blocks**: https://sepolia.base.org (2-second blocks)
- **Flashblocks**: https://sepolia-preconf.base.org (200-millisecond blocks)
- **WebSocket**: wss://sepolia.flashblocks.base.org/ws (real-time updates)

## Deployment

The application is deployed at [https://flashcatch.vercel.app](https://flashcatch.vercel.app)

## Built For

This project was built for the Base Flashblocks Builder Side Quest at ETHDenver 2024.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Base team for the Flashblocks technology
- Flashbots team for their contributions to blockchain efficiency
- ETHDenver for hosting the hackathon
