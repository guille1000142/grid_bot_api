<div align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">GRID BOT</h3>

  <p align="center">
   CHAINLINK HACKATHON 2022
    <br />
    <a href="https://wispy-snowflake-7196.on.fleek.co/" target="_blank"><strong>Visit project</strong></a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
## Table of contents

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#configuration">Configuration</a>
       <ul>
        <li><a href="#instances">Instances</a></li>
        <li><a href="#enviroments-variables">Enviroments variables</a></li>
      </ul>
    </li>
    <li>
      <a href="#api-usage">API usage</a>
      <ul>
        <li><a href="#api-authorization">API authorization</a></li>
        <li><a href="#api-requests">API requests</a></li>
      </ul>
    </li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* npm
  ```sh
  npm install npm@latest -g
  ```
  
* node.js version 16.16.0
 
### Installation

1. Clone the repository
   ```sh
    git clone https://github.com/your_username_/Project-Name.git
   ```

2. Install NPM packages
   ```sh
    npm install
   ```

<!-- CONFIG -->
## Configuration

### Instances
This configuration allow run instances in local node for tests

* IPFS
  ```js
  const ipfsConfig = {
    repo: "./nfts",
    start: false,
    EXPERIMENTAL: {
      pubsub: true,
    },
  }
  ```

* Orbit-DB
  ```js
  const orbitDbConfig = {
    offline: true,
    id: "test-local-node",
  }
  ```

### Enviroments variables

* Enter enviroments variables in `.env`
   ```
   NODE_PORT=
   CORS_ORIGIN=
   QUICKNODE_RPC=
   JWT_TOKEN_SECRET=
   ```  

<!-- SETUP -->
## Setup

1. Run node
   ```sh
   npm run start
   ```



<!-- USAGE -->
## API usage

### API Authorization

This is required to check that the wallet trying to request something is actually the owner of the wallet. 
Ex. Modify NFT likes in a orbitDB document.


* Install
  ```sh
  npm install fast-jwt web3
  ```

* Import
  ```js
  import web3 from 'web3'
  import { createSigner } from 'fast-jwt';
  ```

* Sign message with metamask wallet
  ```js
  const signature = await web3.metamask.eth.personal.sign("ENTER_MESSAGE_TO_SIGN", "ENTER_SIGNER_ADDRESS")
  ```

* Create JWT with wallet signature
  ```js
  const sign = createSigner({ key: 'ENTER_PRIVATE_KEY' });
  const jwt = sign({ signature: 'ENTER_WALLET_SIGNATURE });
  ```

### API requests

* Resize images to .avif before uploading image to NFT.Storage
  ```js
  const formData = new FormData();
  formData.append("image", file, file.name);
  formData.append("dimensions", dimensions);

  fetch('http://localhost:5000/api/v1/converter/image', {
    method: "POST",
    headers: {
     Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  })
  ```

* Create new Orbit-DB document and store NFT likes
  ```js
  const wallet = 'METAMASK_WALLET'
  const cid = 'NFT_STORAGE_IPFS_CID'

  fetch(`http://localhost:5000/api/v1/nft/create?wallet=${wallet}`, {
    method: "PUT",
    headers: {
     Authorization: `Bearer ${jwt}`,
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     cid: cid,
    })
  })
  ```

* Fetch and return NFT metadata.json from IPFS and NFT document from Orbit-DB.
  ```js
  const cid = 'NFT_STORAGE_IPFS_CID'

  fetch(`http://localhost:5000/api/v1/nft/metadata/${cid}`, {
    method: "GET",
    headers: {
     Authorization: `Bearer ${jwt}`,
     "Content-Type": "application/json",
    },
  })
  ```



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.



<!-- CONTACT -->
## Contact

* Leandro Labiano - Blockchain Developer - [@your_twitter](https://twitter.com/your_username) - email@example.com
* Guillermo Izquierdo - Full Stack Developer - [@S7Joms](https://twitter.com/S7Joms) - guille1000142@gmail.com
