import { useState } from 'react';

// Domain mapping for stock logos - comprehensive coverage for 400+ stocks
const STOCK_DOMAINS: Record<string, string> = {
  // Mega Cap Tech
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  AMZN: 'amazon.com',
  META: 'meta.com',
  TSLA: 'tesla.com',
  NVDA: 'nvidia.com',
  TSM: 'tsmc.com',
  AVGO: 'broadcom.com',
  
  // Semiconductors
  AMD: 'amd.com',
  INTC: 'intel.com',
  QCOM: 'qualcomm.com',
  TXN: 'ti.com',
  MU: 'micron.com',
  ASML: 'asml.com',
  LRCX: 'lamresearch.com',
  AMAT: 'appliedmaterials.com',
  KLAC: 'kla.com',
  MRVL: 'marvell.com',
  ADI: 'analog.com',
  NXPI: 'nxp.com',
  ON: 'onsemi.com',
  MPWR: 'monolithicpower.com',
  SWKS: 'skyworksinc.com',
  QRVO: 'qorvo.com',
  ENTG: 'entegris.com',
  TER: 'teradyne.com',
  
  // Software & Cloud
  CRM: 'salesforce.com',
  ORCL: 'oracle.com',
  ADBE: 'adobe.com',
  NOW: 'servicenow.com',
  INTU: 'intuit.com',
  SNOW: 'snowflake.com',
  PANW: 'paloaltonetworks.com',
  CRWD: 'crowdstrike.com',
  DDOG: 'datadoghq.com',
  ZS: 'zscaler.com',
  WDAY: 'workday.com',
  TEAM: 'atlassian.com',
  SPLK: 'splunk.com',
  FTNT: 'fortinet.com',
  NET: 'cloudflare.com',
  MDB: 'mongodb.com',
  OKTA: 'okta.com',
  VEEV: 'veeva.com',
  HUBS: 'hubspot.com',
  TTD: 'thetradedesk.com',
  ANSS: 'ansys.com',
  CDNS: 'cadence.com',
  SNPS: 'synopsys.com',
  PTC: 'ptc.com',
  PAYC: 'paycom.com',
  PCTY: 'paylocity.com',
  BILL: 'bill.com',
  PATH: 'uipath.com',
  IBM: 'ibm.com',
  
  // Internet & E-Commerce
  NFLX: 'netflix.com',
  BKNG: 'booking.com',
  ABNB: 'airbnb.com',
  UBER: 'uber.com',
  LYFT: 'lyft.com',
  SHOP: 'shopify.com',
  SQ: 'block.xyz',
  PYPL: 'paypal.com',
  COIN: 'coinbase.com',
  ROKU: 'roku.com',
  SPOT: 'spotify.com',
  DASH: 'doordash.com',
  ZM: 'zoom.us',
  DOCU: 'docusign.com',
  ETSY: 'etsy.com',
  EBAY: 'ebay.com',
  PINS: 'pinterest.com',
  TWLO: 'twilio.com',
  MTCH: 'match.com',
  
  // Financials - Banks
  JPM: 'jpmorganchase.com',
  BAC: 'bankofamerica.com',
  WFC: 'wellsfargo.com',
  C: 'citigroup.com',
  GS: 'goldmansachs.com',
  MS: 'morganstanley.com',
  SCHW: 'schwab.com',
  USB: 'usbank.com',
  PNC: 'pnc.com',
  TFC: 'truist.com',
  BK: 'bnymellon.com',
  STT: 'statestreet.com',
  FITB: '53.com',
  MTB: 'mtb.com',
  HBAN: 'huntington.com',
  RF: 'regions.com',
  CFG: 'citizensbank.com',
  KEY: 'key.com',
  ZION: 'zionsbank.com',
  CMA: 'comerica.com',
  ALLY: 'ally.com',
  DFS: 'discover.com',
  COF: 'capitalone.com',
  
  // Financials - Other
  V: 'visa.com',
  MA: 'mastercard.com',
  AXP: 'americanexpress.com',
  BLK: 'blackrock.com',
  SPGI: 'spglobal.com',
  CME: 'cmegroup.com',
  ICE: 'ice.com',
  MCO: 'moodys.com',
  CB: 'chubb.com',
  MMC: 'marshmclennan.com',
  AON: 'aon.com',
  AJG: 'ajg.com',
  TRV: 'travelers.com',
  ALL: 'allstate.com',
  PGR: 'progressive.com',
  MET: 'metlife.com',
  PRU: 'prudential.com',
  AIG: 'aig.com',
  AFL: 'aflac.com',
  MSCI: 'msci.com',
  FIS: 'fisglobal.com',
  FISV: 'fiserv.com',
  GPN: 'globalpayments.com',
  NDAQ: 'nasdaq.com',
  CBOE: 'cboe.com',
  
  // Healthcare - Pharma & Biotech
  JNJ: 'jnj.com',
  UNH: 'unitedhealthgroup.com',
  LLY: 'lilly.com',
  PFE: 'pfizer.com',
  ABBV: 'abbvie.com',
  MRK: 'merck.com',
  TMO: 'thermofisher.com',
  ABT: 'abbott.com',
  DHR: 'danaher.com',
  BMY: 'bms.com',
  AMGN: 'amgen.com',
  GILD: 'gilead.com',
  REGN: 'regeneron.com',
  VRTX: 'vrtx.com',
  MRNA: 'modernatx.com',
  ISRG: 'intuitive.com',
  MDT: 'medtronic.com',
  SYK: 'stryker.com',
  BSX: 'bostonscientific.com',
  EW: 'edwards.com',
  BDX: 'bd.com',
  ZBH: 'zimmerbiomet.com',
  CI: 'cigna.com',
  ELV: 'elevancehealth.com',
  HUM: 'humana.com',
  CVS: 'cvs.com',
  MCK: 'mckesson.com',
  CAH: 'cardinalhealth.com',
  BIIB: 'biogen.com',
  ILMN: 'illumina.com',
  DXCM: 'dexcom.com',
  IQV: 'iqvia.com',
  A: 'agilent.com',
  IDXX: 'idexx.com',
  HOLX: 'hologic.com',
  ALGN: 'aligntech.com',
  
  // Consumer - Retail
  WMT: 'walmart.com',
  COST: 'costco.com',
  HD: 'homedepot.com',
  LOW: 'lowes.com',
  TGT: 'target.com',
  TJX: 'tjx.com',
  ROST: 'rossstores.com',
  DG: 'dollargeneral.com',
  DLTR: 'dollartree.com',
  BBY: 'bestbuy.com',
  ORLY: 'oreillyauto.com',
  AZO: 'autozone.com',
  AAP: 'advanceautoparts.com',
  TSCO: 'tractorsupply.com',
  ULTA: 'ulta.com',
  WSM: 'williams-sonoma.com',
  RH: 'rh.com',
  GPS: 'gap.com',
  ANF: 'abercrombie.com',
  KSS: 'kohls.com',
  M: 'macys.com',
  JWN: 'nordstrom.com',
  FIVE: 'fivebelow.com',
  BURL: 'burlington.com',
  FL: 'footlocker.com',
  
  // Consumer - Staples
  PG: 'pg.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  PM: 'pmi.com',
  MO: 'altria.com',
  MDLZ: 'mondelezinternational.com',
  CL: 'colgatepalmolive.com',
  KMB: 'kimberly-clark.com',
  GIS: 'generalmills.com',
  K: 'kellanova.com',
  HSY: 'thehersheycompany.com',
  SJM: 'jmsmucker.com',
  CAG: 'conagrabrands.com',
  CPB: 'campbellsoupcompany.com',
  HRL: 'hormelfoods.com',
  TSN: 'tysonfoods.com',
  KR: 'kroger.com',
  SYY: 'sysco.com',
  STZ: 'cbrands.com',
  EL: 'esteelauder.com',
  CHD: 'churchdwight.com',
  CLX: 'clorox.com',
  WBA: 'walgreens.com',
  
  // Consumer - Discretionary
  MCD: 'mcdonalds.com',
  SBUX: 'starbucks.com',
  NKE: 'nike.com',
  DIS: 'disney.com',
  CMCSA: 'comcast.com',
  CHTR: 'charter.com',
  LVS: 'sands.com',
  MGM: 'mgmresorts.com',
  MAR: 'marriott.com',
  HLT: 'hilton.com',
  WYNN: 'wynnresorts.com',
  RCL: 'royalcaribbean.com',
  CCL: 'carnival.com',
  NCLH: 'ncl.com',
  YUM: 'yum.com',
  CMG: 'chipotle.com',
  DPZ: 'dominos.com',
  DRI: 'darden.com',
  LEN: 'lennar.com',
  DHI: 'drhorton.com',
  PHM: 'pultegroup.com',
  TOL: 'tollbrothers.com',
  NVR: 'nvrinc.com',
  F: 'ford.com',
  GM: 'gm.com',
  TM: 'toyota.com',
  HMC: 'honda.com',
  APTV: 'aptiv.com',
  
  // Industrials
  CAT: 'caterpillar.com',
  DE: 'deere.com',
  HON: 'honeywell.com',
  UPS: 'ups.com',
  UNP: 'up.com',
  RTX: 'rtx.com',
  BA: 'boeing.com',
  LMT: 'lockheedmartin.com',
  GE: 'ge.com',
  MMM: '3m.com',
  GD: 'gd.com',
  NOC: 'northropgrumman.com',
  CSX: 'csx.com',
  NSC: 'nscorp.com',
  FDX: 'fedex.com',
  EMR: 'emerson.com',
  ETN: 'eaton.com',
  ITW: 'itw.com',
  PH: 'parker.com',
  ROK: 'rockwellautomation.com',
  AME: 'ametek.com',
  CMI: 'cummins.com',
  PCAR: 'paccar.com',
  ODFL: 'odfl.com',
  JCI: 'johnsoncontrols.com',
  TT: 'tranetechnologies.com',
  CARR: 'carrier.com',
  OTIS: 'otis.com',
  WM: 'wm.com',
  RSG: 'republicservices.com',
  FAST: 'fastenal.com',
  GWW: 'grainger.com',
  
  // Energy
  XOM: 'exxonmobil.com',
  CVX: 'chevron.com',
  COP: 'conocophillips.com',
  SLB: 'slb.com',
  EOG: 'eogresources.com',
  PXD: 'pxd.com',
  MPC: 'marathonpetroleum.com',
  VLO: 'valero.com',
  PSX: 'phillips66.com',
  OXY: 'oxy.com',
  HAL: 'halliburton.com',
  BKR: 'bakerhughes.com',
  DVN: 'devonenergy.com',
  HES: 'hess.com',
  FANG: 'diamondbackenergy.com',
  KMI: 'kindermorgan.com',
  WMB: 'williams.com',
  OKE: 'oneok.com',
  
  // Utilities
  NEE: 'nexteraenergy.com',
  DUK: 'duke-energy.com',
  SO: 'southerncompany.com',
  D: 'dominionenergy.com',
  AEP: 'aep.com',
  EXC: 'exeloncorp.com',
  SRE: 'sempra.com',
  XEL: 'xcelenergy.com',
  ED: 'coned.com',
  WEC: 'wecenergygroup.com',
  ES: 'eversource.com',
  AWK: 'amwater.com',
  
  // Telecom
  T: 'att.com',
  VZ: 'verizon.com',
  TMUS: 't-mobile.com',
  CSCO: 'cisco.com',
  
  // Materials
  LIN: 'linde.com',
  APD: 'airproducts.com',
  SHW: 'sherwin-williams.com',
  ECL: 'ecolab.com',
  FCX: 'fcx.com',
  NEM: 'newmont.com',
  NUE: 'nucor.com',
  DOW: 'dow.com',
  DD: 'dupont.com',
  PPG: 'ppg.com',
  VMC: 'vulcanmaterials.com',
  MLM: 'martinmarietta.com',
  BALL: 'ball.com',
  PKG: 'packagingcorp.com',
  IP: 'internationalpaper.com',
  
  // REITs
  AMT: 'americantower.com',
  PLD: 'prologis.com',
  CCI: 'crowncastle.com',
  EQIX: 'equinix.com',
  PSA: 'publicstorage.com',
  SPG: 'simon.com',
  O: 'realtyincome.com',
  WELL: 'welltower.com',
  DLR: 'digitalrealty.com',
  AVB: 'avalonbay.com',
  EQR: 'equityapartments.com',
  VTR: 'ventasreit.com',
  ARE: 'are.com',
  MAA: 'maac.com',
  UDR: 'udr.com',
  
  // Additional Tech
  HPQ: 'hp.com',
  HPE: 'hpe.com',
  DELL: 'dell.com',
  WDC: 'westerndigital.com',
  STX: 'seagate.com',
};

// Instrument metadata with names and categories
interface InstrumentMeta {
  name: string;
  category?: 'crypto' | 'commodity' | 'stock' | 'fx';
}

const INSTRUMENT_METADATA: Record<string, InstrumentMeta> = {
  // Forex pairs - Major
  'EURUSD': { name: 'EUR/USD', category: 'fx' },
  'GBPUSD': { name: 'GBP/USD', category: 'fx' },
  'USDJPY': { name: 'USD/JPY', category: 'fx' },
  'AUDUSD': { name: 'AUD/USD', category: 'fx' },
  'USDCAD': { name: 'USD/CAD', category: 'fx' },
  'USDCHF': { name: 'USD/CHF', category: 'fx' },
  'NZDUSD': { name: 'NZD/USD', category: 'fx' },
  // Forex pairs - Cross
  'EURGBP': { name: 'EUR/GBP', category: 'fx' },
  'EURJPY': { name: 'EUR/JPY', category: 'fx' },
  'GBPJPY': { name: 'GBP/JPY', category: 'fx' },
  'AUDJPY': { name: 'AUD/JPY', category: 'fx' },
  'EURAUD': { name: 'EUR/AUD', category: 'fx' },
  'EURCHF': { name: 'EUR/CHF', category: 'fx' },
  'GBPCHF': { name: 'GBP/CHF', category: 'fx' },
  'CADJPY': { name: 'CAD/JPY', category: 'fx' },
  'CHFJPY': { name: 'CHF/JPY', category: 'fx' },
  'AUDNZD': { name: 'AUD/NZD', category: 'fx' },
  'AUDCAD': { name: 'AUD/CAD', category: 'fx' },
  'NZDJPY': { name: 'NZD/JPY', category: 'fx' },
  'GBPAUD': { name: 'GBP/AUD', category: 'fx' },
  'EURCAD': { name: 'EUR/CAD', category: 'fx' },
  'AUDCHF': { name: 'AUD/CHF', category: 'fx' },
  'EURNZD': { name: 'EUR/NZD', category: 'fx' },
  'GBPNZD': { name: 'GBP/NZD', category: 'fx' },
  'GBPCAD': { name: 'GBP/CAD', category: 'fx' },
  'CADCHF': { name: 'CAD/CHF', category: 'fx' },
  'NZDCAD': { name: 'NZD/CAD', category: 'fx' },
  'NZDCHF': { name: 'NZD/CHF', category: 'fx' },
  // Forex pairs - Exotic
  'USDHKD': { name: 'USD/HKD', category: 'fx' },
  'USDSGD': { name: 'USD/SGD', category: 'fx' },
  'USDZAR': { name: 'USD/ZAR', category: 'fx' },
  'USDMXN': { name: 'USD/MXN', category: 'fx' },
  'USDTRY': { name: 'USD/TRY', category: 'fx' },
  'USDSEK': { name: 'USD/SEK', category: 'fx' },
  'USDNOK': { name: 'USD/NOK', category: 'fx' },
  'USDDKK': { name: 'USD/DKK', category: 'fx' },
  'USDPLN': { name: 'USD/PLN', category: 'fx' },
  'USDCZK': { name: 'USD/CZK', category: 'fx' },
  'USDHUF': { name: 'USD/HUF', category: 'fx' },
  'USDCNH': { name: 'USD/CNH', category: 'fx' },
  'USDTHB': { name: 'USD/THB', category: 'fx' },
  'USDINR': { name: 'USD/INR', category: 'fx' },
  'USDRUB': { name: 'USD/RUB', category: 'fx' },
  'EURHUF': { name: 'EUR/HUF', category: 'fx' },
  'EURPLN': { name: 'EUR/PLN', category: 'fx' },
  'EURCZK': { name: 'EUR/CZK', category: 'fx' },
  'EURSEK': { name: 'EUR/SEK', category: 'fx' },
  'EURNOK': { name: 'EUR/NOK', category: 'fx' },
  'EURTRY': { name: 'EUR/TRY', category: 'fx' },
  'EURZAR': { name: 'EUR/ZAR', category: 'fx' },
  'SGDJPY': { name: 'SGD/JPY', category: 'fx' },
  'EURCNY': { name: 'EUR/CNY', category: 'fx' },
  // Commodities
  'GC': { name: 'Gold', category: 'commodity' },
  'SI': { name: 'Silver', category: 'commodity' },
  'HG': { name: 'Copper', category: 'commodity' },
  'PL': { name: 'Platinum', category: 'commodity' },
  'PA': { name: 'Palladium', category: 'commodity' },
  'CL': { name: 'Crude Oil (WTI)', category: 'commodity' },
  'NG': { name: 'Natural Gas', category: 'commodity' },
  'RB': { name: 'Gasoline', category: 'commodity' },
  'HO': { name: 'Heating Oil', category: 'commodity' },
  'ZC': { name: 'Corn', category: 'commodity' },
  'ZW': { name: 'Wheat', category: 'commodity' },
  'ZS': { name: 'Soybeans', category: 'commodity' },
  'KC': { name: 'Coffee', category: 'commodity' },
  'SB': { name: 'Sugar', category: 'commodity' },
  'CC': { name: 'Cocoa', category: 'commodity' },
  'CT': { name: 'Cotton', category: 'commodity' },
  'ZO': { name: 'Oats', category: 'commodity' },
  'ZR': { name: 'Rice', category: 'commodity' },
  'ZL': { name: 'Soybean Oil', category: 'commodity' },
  'LE': { name: 'Live Cattle', category: 'commodity' },
  'HE': { name: 'Lean Hogs', category: 'commodity' },
  'GF': { name: 'Feeder Cattle', category: 'commodity' },
  'BZ': { name: 'Brent Crude', category: 'commodity' },
  // Crypto - Top 100+
  'BTC': { name: 'Bitcoin', category: 'crypto' },
  'ETH': { name: 'Ethereum', category: 'crypto' },
  'SOL': { name: 'Solana', category: 'crypto' },
  'BNB': { name: 'BNB', category: 'crypto' },
  'XRP': { name: 'XRP', category: 'crypto' },
  'ADA': { name: 'Cardano', category: 'crypto' },
  'AVAX': { name: 'Avalanche', category: 'crypto' },
  'DOGE': { name: 'Dogecoin', category: 'crypto' },
  'LINK': { name: 'Chainlink', category: 'crypto' },
  'MATIC': { name: 'Polygon', category: 'crypto' },
  'DOT': { name: 'Polkadot', category: 'crypto' },
  'SHIB': { name: 'Shiba Inu', category: 'crypto' },
  'LTC': { name: 'Litecoin', category: 'crypto' },
  'UNI': { name: 'Uniswap', category: 'crypto' },
  'ATOM': { name: 'Cosmos', category: 'crypto' },
  'XLM': { name: 'Stellar', category: 'crypto' },
  'NEAR': { name: 'NEAR Protocol', category: 'crypto' },
  'APT': { name: 'Aptos', category: 'crypto' },
  'ARB': { name: 'Arbitrum', category: 'crypto' },
  'OP': { name: 'Optimism', category: 'crypto' },
  'FIL': { name: 'Filecoin', category: 'crypto' },
  'INJ': { name: 'Injective', category: 'crypto' },
  'AAVE': { name: 'Aave', category: 'crypto' },
  'MKR': { name: 'Maker', category: 'crypto' },
  'SAND': { name: 'The Sandbox', category: 'crypto' },
  'TRX': { name: 'TRON', category: 'crypto' },
  'BCH': { name: 'Bitcoin Cash', category: 'crypto' },
  'XMR': { name: 'Monero', category: 'crypto' },
  'ETC': { name: 'Ethereum Classic', category: 'crypto' },
  'ALGO': { name: 'Algorand', category: 'crypto' },
  'VET': { name: 'VeChain', category: 'crypto' },
  'MANA': { name: 'Decentraland', category: 'crypto' },
  'AXS': { name: 'Axie Infinity', category: 'crypto' },
  'FTM': { name: 'Fantom', category: 'crypto' },
  'THETA': { name: 'Theta Network', category: 'crypto' },
  'EGLD': { name: 'MultiversX', category: 'crypto' },
  'FLOW': { name: 'Flow', category: 'crypto' },
  'XTZ': { name: 'Tezos', category: 'crypto' },
  'EOS': { name: 'EOS', category: 'crypto' },
  'CHZ': { name: 'Chiliz', category: 'crypto' },
  'CRV': { name: 'Curve DAO', category: 'crypto' },
  'LDO': { name: 'Lido DAO', category: 'crypto' },
  'RUNE': { name: 'THORChain', category: 'crypto' },
  'SNX': { name: 'Synthetix', category: 'crypto' },
  'COMP': { name: 'Compound', category: 'crypto' },
  'ZEC': { name: 'Zcash', category: 'crypto' },
  'DASH': { name: 'Dash', category: 'crypto' },
  'NEO': { name: 'Neo', category: 'crypto' },
  'WAVES': { name: 'Waves', category: 'crypto' },
  'ZIL': { name: 'Zilliqa', category: 'crypto' },
  'SUI': { name: 'Sui', category: 'crypto' },
  'SEI': { name: 'Sei', category: 'crypto' },
  'PEPE': { name: 'Pepe', category: 'crypto' },
  'WIF': { name: 'dogwifhat', category: 'crypto' },
  'BONK': { name: 'Bonk', category: 'crypto' },
  'FLOKI': { name: 'Floki', category: 'crypto' },
  'IMX': { name: 'Immutable', category: 'crypto' },
  'GALA': { name: 'Gala', category: 'crypto' },
  'APE': { name: 'ApeCoin', category: 'crypto' },
  'ICP': { name: 'Internet Computer', category: 'crypto' },
  'HBAR': { name: 'Hedera', category: 'crypto' },
  'KAS': { name: 'Kaspa', category: 'crypto' },
  'FET': { name: 'Fetch.ai', category: 'crypto' },
  'RNDR': { name: 'Render', category: 'crypto' },
  'GRT': { name: 'The Graph', category: 'crypto' },
  'STX': { name: 'Stacks', category: 'crypto' },
  'ENS': { name: 'ENS', category: 'crypto' },
  'QNT': { name: 'Quant', category: 'crypto' },
  'FLR': { name: 'Flare', category: 'crypto' },
  'MINA': { name: 'Mina Protocol', category: 'crypto' },
  'KAVA': { name: 'Kava', category: 'crypto' },
  'ONE': { name: 'Harmony', category: 'crypto' },
  'CELO': { name: 'Celo', category: 'crypto' },
  'ENJ': { name: 'Enjin Coin', category: 'crypto' },
  'SKL': { name: 'SKALE', category: 'crypto' },
  'LRC': { name: 'Loopring', category: 'crypto' },
  'BAT': { name: 'Basic Attention Token', category: 'crypto' },
  'IOTA': { name: 'IOTA', category: 'crypto' },
  'ZRX': { name: '0x Protocol', category: 'crypto' },
  'CKB': { name: 'Nervos Network', category: 'crypto' },
  'ROSE': { name: 'Oasis Network', category: 'crypto' },
  'GMT': { name: 'STEPN', category: 'crypto' },
  '1INCH': { name: '1inch', category: 'crypto' },
  'OCEAN': { name: 'Ocean Protocol', category: 'crypto' },
  'MASK': { name: 'Mask Network', category: 'crypto' },
  'BLUR': { name: 'Blur', category: 'crypto' },
  'DYDX': { name: 'dYdX', category: 'crypto' },
  'GMX': { name: 'GMX', category: 'crypto' },
  'PENDLE': { name: 'Pendle', category: 'crypto' },
  'WOO': { name: 'WOO Network', category: 'crypto' },
  'SSV': { name: 'SSV Network', category: 'crypto' },
  'RPL': { name: 'Rocket Pool', category: 'crypto' },
  'ANKR': { name: 'Ankr', category: 'crypto' },
  'STORJ': { name: 'Storj', category: 'crypto' },
  'YFI': { name: 'yearn.finance', category: 'crypto' },
  'SUSHI': { name: 'SushiSwap', category: 'crypto' },
  'BAND': { name: 'Band Protocol', category: 'crypto' },
  'OMG': { name: 'OMG Network', category: 'crypto' },
  'QTUM': { name: 'Qtum', category: 'crypto' },
  'ICX': { name: 'ICON', category: 'crypto' },
  // US Stocks - Top 100
  'AAPL': { name: 'Apple', category: 'stock' },
  'MSFT': { name: 'Microsoft', category: 'stock' },
  'GOOGL': { name: 'Alphabet', category: 'stock' },
  'GOOG': { name: 'Alphabet', category: 'stock' },
  'AMZN': { name: 'Amazon', category: 'stock' },
  'META': { name: 'Meta', category: 'stock' },
  'TSLA': { name: 'Tesla', category: 'stock' },
  'NVDA': { name: 'NVIDIA', category: 'stock' },
  'JPM': { name: 'JPMorgan', category: 'stock' },
  'V': { name: 'Visa', category: 'stock' },
  'JNJ': { name: 'J&J', category: 'stock' },
  'WMT': { name: 'Walmart', category: 'stock' },
  'PG': { name: 'P&G', category: 'stock' },
  'MA': { name: 'Mastercard', category: 'stock' },
  'UNH': { name: 'UnitedHealth', category: 'stock' },
  'HD': { name: 'Home Depot', category: 'stock' },
  'DIS': { name: 'Disney', category: 'stock' },
  'BAC': { name: 'Bank of America', category: 'stock' },
  'XOM': { name: 'Exxon', category: 'stock' },
  'PFE': { name: 'Pfizer', category: 'stock' },
  'KO': { name: 'Coca-Cola', category: 'stock' },
  'PEP': { name: 'PepsiCo', category: 'stock' },
  'CSCO': { name: 'Cisco', category: 'stock' },
  'NFLX': { name: 'Netflix', category: 'stock' },
  'INTC': { name: 'Intel', category: 'stock' },
  'AMD': { name: 'AMD', category: 'stock' },
  'CRM': { name: 'Salesforce', category: 'stock' },
  'ORCL': { name: 'Oracle', category: 'stock' },
  'ADBE': { name: 'Adobe', category: 'stock' },
  'AVGO': { name: 'Broadcom', category: 'stock' },
  'QCOM': { name: 'Qualcomm', category: 'stock' },
  'TXN': { name: 'Texas Instruments', category: 'stock' },
  'MU': { name: 'Micron', category: 'stock' },
  'NOW': { name: 'ServiceNow', category: 'stock' },
  'INTU': { name: 'Intuit', category: 'stock' },
  'PYPL': { name: 'PayPal', category: 'stock' },
  'UBER': { name: 'Uber', category: 'stock' },
  'ABNB': { name: 'Airbnb', category: 'stock' },
  'COIN': { name: 'Coinbase', category: 'stock' },
  'GS': { name: 'Goldman Sachs', category: 'stock' },
  'MS': { name: 'Morgan Stanley', category: 'stock' },
  'C': { name: 'Citigroup', category: 'stock' },
  'WFC': { name: 'Wells Fargo', category: 'stock' },
  'AXP': { name: 'American Express', category: 'stock' },
  'BLK': { name: 'BlackRock', category: 'stock' },
  'ABBV': { name: 'AbbVie', category: 'stock' },
  'MRK': { name: 'Merck', category: 'stock' },
  'LLY': { name: 'Eli Lilly', category: 'stock' },
  'TMO': { name: 'Thermo Fisher', category: 'stock' },
  'ABT': { name: 'Abbott', category: 'stock' },
  'CVS': { name: 'CVS Health', category: 'stock' },
  'MRNA': { name: 'Moderna', category: 'stock' },
  'COST': { name: 'Costco', category: 'stock' },
  'TGT': { name: 'Target', category: 'stock' },
  'LOW': { name: 'Lowes', category: 'stock' },
  'NKE': { name: 'Nike', category: 'stock' },
  'SBUX': { name: 'Starbucks', category: 'stock' },
  'MCD': { name: 'McDonalds', category: 'stock' },
  'BA': { name: 'Boeing', category: 'stock' },
  'CAT': { name: 'Caterpillar', category: 'stock' },
  'HON': { name: 'Honeywell', category: 'stock' },
  'UPS': { name: 'UPS', category: 'stock' },
  'FDX': { name: 'FedEx', category: 'stock' },
  'LMT': { name: 'Lockheed Martin', category: 'stock' },
  'GE': { name: 'General Electric', category: 'stock' },
  'CVX': { name: 'Chevron', category: 'stock' },
  'COP': { name: 'ConocoPhillips', category: 'stock' },
  'T': { name: 'AT&T', category: 'stock' },
  'VZ': { name: 'Verizon', category: 'stock' },
  'TMUS': { name: 'T-Mobile', category: 'stock' },
  'F': { name: 'Ford', category: 'stock' },
  'GM': { name: 'General Motors', category: 'stock' },
};

type InstrumentCategory = 'crypto' | 'stock' | 'fx' | 'commodities';

function cleanInstrumentName(instrument: string): string {
  return instrument.replace('-USD', '').replace('=X', '').replace('/USD', '').replace('=F', '');
}

function detectCategory(instrument: string): InstrumentCategory {
  const upper = instrument.toUpperCase();
  if (upper.endsWith('=F')) return 'commodities';
  if (upper.endsWith('=X')) return 'fx';
  if (upper.includes('-USD') || upper.endsWith('USDT')) return 'crypto';
  const ticker = cleanInstrumentName(upper);
  if (STOCK_DOMAINS[ticker]) return 'stock';
  if (upper.length === 6 && !upper.includes('-')) return 'fx';
  return 'stock';
}

function extractTicker(instrument: string): string {
  return instrument
    .toUpperCase()
    .replace('-USD', '')
    .replace('=X', '')
    .replace('=F', '')
    .replace('USDT', '');
}

function getInstrumentMeta(instrument: string): InstrumentMeta | null {
  const ticker = cleanInstrumentName(instrument);
  return INSTRUMENT_METADATA[ticker] || null;
}

function getLogoUrls(ticker: string, category: InstrumentCategory): string[] {
  const urls: string[] = [];

  if (category === 'crypto') {
    const lowerTicker = ticker.toLowerCase();
    urls.push(`https://assets.coingecko.com/coins/images/1/small/${lowerTicker}.png`);
    urls.push(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${lowerTicker}.png`);
    urls.push(`https://cryptologos.cc/logos/${lowerTicker}-${lowerTicker}-logo.png`);
  } else if (category === 'stock') {
    const domain = STOCK_DOMAINS[ticker];
    if (domain) {
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      urls.push(`https://logo.clearbit.com/${domain}`);
    }
  }

  return urls;
}

interface InstrumentLogoProps {
  instrument: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showName?: boolean;
}

const SIZES = {
  sm: 'w-5 h-5 text-[8px]',
  md: 'w-7 h-7 text-sm',
  lg: 'w-10 h-10 text-xs',
};

export function InstrumentLogo({ instrument, size = 'md', className = '', showName = true }: InstrumentLogoProps) {
  const [logoIndex, setLogoIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  const category = detectCategory(instrument);
  const ticker = extractTicker(instrument);
  const meta = getInstrumentMeta(instrument);
  const logoUrls = getLogoUrls(ticker, category);
  const initials = ticker.slice(0, 2);
  const sizeClasses = SIZES[size];

  const handleError = () => {
    if (logoIndex < logoUrls.length - 1) {
      setLogoIndex((prev) => prev + 1);
    } else {
      setLogoFailed(true);
    }
  };

  const renderLogo = () => {
    // FX and commodities don't have good logo sources - just show initials
    if (category === 'fx' || category === 'commodities' || logoUrls.length === 0 || logoFailed) {
      return (
        <div
          className={`${sizeClasses} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0`}
        >
          {initials}
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses} rounded-full bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0`}
      >
        <img
          src={logoUrls[logoIndex]}
          alt={ticker}
          className="w-full h-full object-cover"
          onError={handleError}
          loading="lazy"
        />
      </div>
    );
  };

  // If showName is false, just return the logo
  if (!showName) {
    return <div className={className}>{renderLogo()}</div>;
  }

  // Return logo with name
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      {renderLogo()}
      {meta?.name && (
        <span className="text-sm text-foreground truncate">
          {meta.name}
        </span>
      )}
      {!meta?.name && (
        <span className="text-sm text-foreground truncate">
          {ticker}
        </span>
      )}
    </div>
  );
}

export default InstrumentLogo;
