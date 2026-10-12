import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = { title: "Retailers", description: "Marrow direct stores and international bridal stockists." };

const overseas = ["Rhode Island, USA: LADY SYCAMORE BRIDAL", "Seoul, South Korea: Sesreves", "Johor, Malaysia: Sanyu Studio"];
const mainland = [
  "Guangzhou: ROSYBRIDAL", "Fuzhou: FORUS", "Changsha: YiJiA Bridal", "Qingdao: LANDO Bridal", "Ningbo: UCIRA", "Taizhou: MEETAOR",
  "Hangzhou: Volbride", "Tianjin: LaMousseStudio.TJ", "Kunming: CHUN BRIDAL", "Shenyang: THEONEBRIDE", "Hefei: LanBridal",
  "Nanjing: MeetLi Bridal", "Chongqing: OUI Bridal", "Wuhan: MoBai Bridal", "Xiamen: Moment LiLi", "Suzhou: LaLune Willing",
];

export default function Retailers() {
  return <main className="retailers-page"><section className="retailers-stage">
    <SiteHeader active="retailers" />
    <h1 className="page-script-title retailers-title">Stockist List</h1>
    <section className="retailers-direct"><h2 className="script-heading">Brand Direct Stores</h2><p>Chengdu Marrow: 1-2, Building 2, U37 Creative Park</p><p>Shanghai Marrow: POP-UP STORE</p></section>
    <section className="retailers-overseas"><h2 className="script-heading">Overseas Stockists</h2>{overseas.map((line) => <p key={line}>{line}</p>)}</section>
    <section className="retailers-mainland"><h2 className="script-heading">Stockists in Mainland China</h2>{mainland.map((line, index) => <p className={index === 6 || index === 11 ? "retailers-list-break" : ""} key={line}>{line}</p>)}</section>
    <img className="retailers-photo" src="/design/stockists.jpg" alt="Marrow bridal gowns at a stockist" />
    <p className="retailers-contact"><span>Brand Contact:</span>marrowbridal</p>
  </section><SiteFooter /></main>;
}
