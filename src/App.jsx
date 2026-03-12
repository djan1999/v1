import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const FONT = "'Roboto Mono', monospace";
const MOBILE_SAFE_INPUT_SIZE = 16;

const initWines = [
  { id: 1, name: "Anže – Pepo", producer: "Anže", vintage: "2020", region: "Goriška brda" },
  { id: 2, name: "Batič – Marlo", producer: "Batič", vintage: "2020", region: "Vipavska dolina" },
  { id: 3, name: "Batič – Zaria", producer: "Batič", vintage: "NV", region: "Vipavska dolina" },
  { id: 4, name: "Burja – Stranice", producer: "Burja", vintage: "2018", region: "Vipavska dolina" },
  { id: 5, name: "Burja – Stranice", producer: "Burja", vintage: "2020", region: "Vipavska dolina" },
  { id: 6, name: "Clos Veličane – Pozana Letina", producer: "Clos Veličane", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 7, name: "Čotar – Gorjansko", producer: "Čotar", vintage: "2022", region: "Kras" },
  { id: 8, name: "Edi Simčič – Triton Lex", producer: "Edi Simčič", vintage: "2022", region: "Goriška brda" },
  { id: 9, name: "Fedora – Goli breg", producer: "Fedora", vintage: "2018", region: "Vipavska dolina" },
  { id: 10, name: "Ferjančič – Fino belo", producer: "Ferjančič", vintage: "2018", region: "Vipavska dolina" },
  { id: 11, name: "Frelih – Brut Nature", producer: "Frelih", vintage: "2016", region: "Dolenjska" },
  { id: 12, name: "Frelih – Echo Extra Brut", producer: "Frelih", vintage: "2016", region: "Dolenjska" },
  { id: 13, name: "Gordia – Amfora", producer: "Gordia", vintage: "2018", region: "Slovenska Istra" },
  { id: 14, name: "Gross – Haloze blanc", producer: "Gross", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 15, name: "Keltis – Žan Belo", producer: "Keltis", vintage: "2020", region: "Bizeljko-Sremič" },
  { id: 16, name: "Keltis – Cuvée Extrême", producer: "Keltis", vintage: "2017", region: "Bizeljsko-Sremič" },
  { id: 17, name: "Klinec – Ortodox", producer: "Klinec", vintage: "2013", region: "Goriška brda" },
  { id: 18, name: "Kobal – Bernhard", producer: "Kobal", vintage: "NV", region: "Štajerska Slovenija" },
  { id: 19, name: "Lobik – Belavšek", producer: "Lobik", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 20, name: "Marof – Cuveé Breg", producer: "Marof", vintage: "2018", region: "Prekmurje" },
  { id: 21, name: "Mlečnik – Cuvee", producer: "Mlečnik", vintage: "2018", region: "Vipavska dolina" },
  { id: 22, name: "Mlečnik – Bukovica", producer: "Mlečnik", vintage: "2016", region: "Vipavska dolina" },
  { id: 23, name: "Movia – Veliko belo", producer: "Movia", vintage: "2021", region: "Goriška brda" },
  { id: 24, name: "Mulit – Mulit belo", producer: "Mulit", vintage: "2019", region: "Goriška brda" },
  { id: 25, name: "Mulit – Mulit belo", producer: "Mulit", vintage: "2021", region: "Goriška brda" },
  { id: 26, name: "Nando – Cherry Oxy", producer: "Nando", vintage: "2010", region: "Goriška brda" },
  { id: 27, name: "Nando – Eugene Belo", producer: "Nando", vintage: "2008", region: "Goriška brda" },
  { id: 28, name: "Nando – Jantar", producer: "Nando", vintage: "NV", region: "Goriška brda" },
  { id: 29, name: "Pasji rep – Moser belo", producer: "Pasji rep", vintage: "2019", region: "Vipavska dolina" },
  { id: 30, name: "Posestvo Bela Gora – Štilj", producer: "Posestvo Bela Gora", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 31, name: "Reja – Poanta", producer: "Reja", vintage: "2014", region: "Goriška brda" },
  { id: 32, name: "Reja – Poanta", producer: "Reja", vintage: "2017", region: "Goriška brda" },
  { id: 33, name: "Renčel – Vincent", producer: "Renčel", vintage: "2018", region: "Kras" },
  { id: 34, name: "Štemberger – Robinia", producer: "Štemberger", vintage: "2018", region: "Kras" },
  { id: 35, name: "Štemberger – Loop", producer: "Štemberger", vintage: "2019", region: "Kras" },
  { id: 36, name: "Štokelj – Planta bela", producer: "Štokelj", vintage: "2019", region: "Vipavska dolina" },
  { id: 37, name: "Štrukelj – Brut", producer: "Štrukelj", vintage: "2016", region: "Vipavska Dolina" },
  { id: 38, name: "Šuman – Moondrops", producer: "Šuman", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 39, name: "Šuman – Sundrops", producer: "Šuman", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 40, name: "Šuman – Sundrops", producer: "Šuman", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 41, name: "Šuman – Moondrops", producer: "Šuman", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 42, name: "Šuman – Essence", producer: "Šuman", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 43, name: "Šumenjak – Alter", producer: "Šumenjak", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 44, name: "VARDA – Pufhelz", producer: "VARDA", vintage: "2022", region: "Vipavska dolina" },
  { id: 45, name: "Zorjan – Cuvee", producer: "Zorjan", vintage: "NV", region: "Štajerska Slovenija" },
  { id: 46, name: "Domaine Slapšak – Blanc de blanc", producer: "Domaine Slapšak", vintage: "NV", region: "Dolenjska", byGlass: true },
  { id: 47, name: "Domaine Vicomte Noue Marinič – Sotto la chiesa Bigliana II Cru", producer: "Domaine Vicomte Noue Marinič", vintage: "2021", region: "Goriška brda" },
  { id: 48, name: "Domaine Vicomte Noue Marinič – Attico San Pietro III Cru", producer: "Domaine Vicomte Noue Marinič", vintage: "2021", region: "Goriška brda" },
  { id: 49, name: "Edi Simčič – Kozana Chardonnay", producer: "Edi Simčič", vintage: "2018", region: "Goriška brda" },
  { id: 50, name: "Hedele – Obelunec Chardonnay", producer: "Hedele", vintage: "2020", region: "Vipavska Dolina" },
  { id: 51, name: "Jakončič – Borgo Scholaris", producer: "Jakončič", vintage: "2018", region: "Goriška brda" },
  { id: 52, name: "JNK – Chardonnay", producer: "JNK", vintage: "2011", region: "Vipavska dolina" },
  { id: 53, name: "Kupljen – Sirius", producer: "Kupljen", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 54, name: "Meum – Chardonnay Prestige", producer: "Meum", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 55, name: "Meum – Chardonnay Prestige", producer: "Meum", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 56, name: "Reja – Chardonnay", producer: "Reja", vintage: "2018", region: "Goriška brda" },
  { id: 57, name: "Reja – Chardonnay", producer: "Reja", vintage: "2017", region: "Goriška brda" },
  { id: 58, name: "Renesansa – Chardonnay", producer: "Renesansa", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 59, name: "Renesansa – Chardonnay Single Vineyard", producer: "Renesansa", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 60, name: "Sanctum – Chardonnay Prestige", producer: "Sanctum", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 61, name: "Sinefinis – BdB Brut", producer: "Sinefinis", vintage: "2018", region: "Goriška brda" },
  { id: 62, name: "Šuman – Chardonnay", producer: "Šuman", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 63, name: "Sutor – Chardonnay", producer: "Sutor", vintage: "2018", region: "Vipavska dolina" },
  { id: 64, name: "Zorjan – Chardonnay", producer: "Zorjan", vintage: "NV", region: "Štajerska Slovenija" },
  { id: 65, name: "Čotar – Malvazija", producer: "Čotar", vintage: "2020", region: "Kras" },
  { id: 66, name: "Gordia – Malvazija", producer: "Gordia", vintage: "2023", region: "Slovenska Istra" },
  { id: 67, name: "Jure Štekar – Malvazija", producer: "Jure Štekar", vintage: "2020", region: "Goriška brda" },
  { id: 68, name: "Klabjan – Malvazija", producer: "Klabjan", vintage: "2020", region: "Slovenska Istra" },
  { id: 69, name: "Klabjan – Malvazija", producer: "Klabjan", vintage: "2017", region: "Slovenska Istra" },
  { id: 70, name: "Klabjan – Malvazija", producer: "Klabjan", vintage: "2019", region: "Slovenska Istra" },
  { id: 71, name: "Klet Čotova – Malvazija", producer: "Klet Čotova", vintage: "2019", region: "Kras" },
  { id: 72, name: "Korenika & Moškon – Paderno", producer: "Korenika & Moškon", vintage: "2013", region: "Slovenska Istra" },
  { id: 73, name: "Krapež – Malvazija", producer: "Krapež", vintage: "2018", region: "Vipavska Dolina" },
  { id: 74, name: "Marko Fon – Malvazija", producer: "Marko Fon", vintage: "2022", region: "Kras" },
  { id: 75, name: "Marko Fon – 4 Stati", producer: "Marko Fon", vintage: "2021", region: "Kras" },
  { id: 76, name: "Marko Fon – Malvazija 1,5L", producer: "Marko Fon", vintage: "2018", region: "Kras" },
  { id: 77, name: "Marko Fon – Malvazija", producer: "Marko Fon", vintage: "2023", region: "Kras" },
  { id: 78, name: "Movia – Turno Malval", producer: "Movia", vintage: "2020", region: "Goriška brda" },
  { id: 79, name: "Murenc – Malvazija", producer: "Murenc", vintage: "2022", region: "Goriška Brda" },
  { id: 80, name: "Nando – Ma Jantar", producer: "Nando", vintage: "2020", region: "Goriška brda" },
  { id: 81, name: "Pasji rep – Malvazija", producer: "Pasji rep", vintage: "2020", region: "Vipavska dolina" },
  { id: 82, name: "Ražman – Malvazija Antica", producer: "Ražman", vintage: "2020", region: "Slovenska Istra" },
  { id: 83, name: "Reja – Malvazija \'M\'", producer: "Reja", vintage: "2017", region: "Goriška brda" },
  { id: 84, name: "Reja – Malvazija", producer: "Reja", vintage: "2020", region: "Goriška brda" },
  { id: 85, name: "Reja – Malvazija", producer: "Reja", vintage: "2019", region: "Goriška brda" },
  { id: 86, name: "Rojac – Malvazija maceracija", producer: "Rojac", vintage: "2017", region: "Slovenska Istra" },
  { id: 87, name: "Slamič – Malvazija", producer: "Slamič", vintage: "2022", region: "Kras" },
  { id: 88, name: "Štemberger – Malvazija", producer: "Štemberger", vintage: "2021", region: "Kras" },
  { id: 89, name: "Štemberger – Malvazija", producer: "Štemberger", vintage: "2022", region: "Kras" },
  { id: 90, name: "Štemberger – Malvazija", producer: "Štemberger", vintage: "2023", region: "Kras" },
  { id: 91, name: "UOU – Malvazija Ivanka", producer: "UOU", vintage: "2019", region: "Vipavska dolina" },
  { id: 92, name: "Zaro – Malvazija maceracija", producer: "Zaro", vintage: "2020", region: "Slovenska Istra" },
  { id: 93, name: "Batič – Pinela selekcija", producer: "Batič", vintage: "2020", region: "Vipavska dolina" },
  { id: 94, name: "Fedora – Pinela 365", producer: "Fedora", vintage: "2020", region: "Vipavska dolina" },
  { id: 95, name: "Guerila – Pinela", producer: "Guerila", vintage: "2020", region: "Vipavska dolina" },
  { id: 96, name: "Marc – Pinela", producer: "Marc", vintage: "2022", region: "Vipavska dolina" },
  { id: 97, name: "Miška – Pinela", producer: "Miška", vintage: "2022", region: "Vipavska dolina" },
  { id: 98, name: "Štokelj – Pinela", producer: "Štokelj", vintage: "2022", region: "Vipavska dolina" },
  { id: 99, name: "Štokelj – Pinela", producer: "Štokelj", vintage: "2020", region: "Vipavska dolina" },
  { id: 100, name: "Zoria – Pinela", producer: "Zoria", vintage: "2023", region: "Vipavska dolina" },
  { id: 101, name: "Anže – Rebula", producer: "Anže", vintage: "2019", region: "Goriška brda" },
  { id: 102, name: "Blažič – Rebula Selekcija", producer: "Blažič", vintage: "2018", region: "Goriška brda" },
  { id: 103, name: "Blažič – Rebula", producer: "Blažič", vintage: "2019", region: "Goriška brda" },
  { id: 104, name: "Blažič – Rebula", producer: "Blažič", vintage: "2022", region: "Goriška brda" },
  { id: 105, name: "Blažič – Rebula Robida", producer: "Blažič", vintage: "2020", region: "Goriška brda" },
  { id: 106, name: "Edi Simčič – Rebula Fojana", producer: "Edi Simčič", vintage: "2021", region: "Goriška brda" },
  { id: 107, name: "JNK – Rebula", producer: "JNK", vintage: "2011", region: "Vipavska dolina" },
  { id: 108, name: "Keber – Rebula Brda", producer: "Keber", vintage: "2019", region: "Goriška brda" },
  { id: 109, name: "Klinec – Rebula", producer: "Klinec", vintage: "2020", region: "Goriška brda" },
  { id: 110, name: "Marjan Simčič – Leonardo", producer: "Marjan Simčič", vintage: "2015", region: "Goriška brda" },
  { id: 111, name: "Movia – Lunar", producer: "Movia", vintage: "2016", region: "Goriška brda" },
  { id: 112, name: "Nando – Re Jantar", producer: "Nando", vintage: "2020", region: "Goriška brda" },
  { id: 113, name: "Reja – Rebula", producer: "Reja", vintage: "2018", region: "Goriška brda" },
  { id: 114, name: "Reja – Rebula \'M\'", producer: "Reja", vintage: "2021", region: "Goriška brda" },
  { id: 115, name: "Sinefinis – Rebolium", producer: "Sinefinis", vintage: "2018", region: "Goriška brda" },
  { id: 116, name: "Svetlik – Rebula Selekcija", producer: "Svetlik", vintage: "2017", region: "Vipavska dolina" },
  { id: 117, name: "Svetlik – Rebula Selekcija", producer: "Svetlik", vintage: "2016", region: "Vipavska dolina" },
  { id: 118, name: "Svetlik – Rebula", producer: "Svetlik", vintage: "2020", region: "Vipavska dolina" },
  { id: 119, name: "Svetlik – Rebula Maximilian", producer: "Svetlik", vintage: "2018", region: "Vipavska dolina" },
  { id: 120, name: "UOU – Rebula Ivanka", producer: "UOU", vintage: "2020", region: "Vipavska dolina" },
  { id: 121, name: "VARDA – Rebula", producer: "VARDA", vintage: "2020", region: "Vipavska dolina" },
  { id: 122, name: "VARDA – Rebula", producer: "VARDA", vintage: "2022", region: "Vipavska dolina" },
  { id: 123, name: "Renesansa – Renski Rizling", producer: "Renesansa", vintage: "2021", region: "Štajerska Slovenija", byGlass: true },
  { id: 124, name: "Clos Veličane – Renski Rizling", producer: "Clos Veličane", vintage: "2023", region: "Štajerska Slovenija", byGlass: true },
  { id: 125, name: "Borut Anderlič – Laški rizling eiswein", producer: "Borut Anderlič", vintage: "2009", region: "Štajerska Slovenija" },
  { id: 126, name: "Clos Veličane – Renski Rizling", producer: "Clos Veličane", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 127, name: "Domen Jaunik – Idea", producer: "Domen Jaunik", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 128, name: "Joannes Protner – Renski rizling", producer: "Joannes Protner", vintage: "2018", region: "Štajerska Slovenija" },
  { id: 129, name: "Keltis – Riesling", producer: "Keltis", vintage: "2021", region: "Bizeljsko-Sremič" },
  { id: 130, name: "Lendwines – Laški Riesling", producer: "Lendwines", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 131, name: "Matic Wines – Riesling", producer: "Matic Wines", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 132, name: "Roka – Laški Rizling", producer: "Roka", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 133, name: "Vinogradnistvo Kovačič – Laški Rizling", producer: "Vinogradnistvo Kovačič", vintage: "NV", region: "Štajerska Slovenija" },
  { id: 134, name: "Zorjan – Laški Rizling", producer: "Zorjan", vintage: "NV", region: "Štajerska Slovenija" },
  { id: 135, name: "Zorjan – Renski Rizling", producer: "Zorjan", vintage: "NV", region: "Štajerska Slovenija" },
  { id: 136, name: "Blažič – Sauvignon Plešivo", producer: "Blažič", vintage: "2015", region: "Goriška brda" },
  { id: 137, name: "Domen Jaunik – Gustel", producer: "Domen Jaunik", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 138, name: "Gross – Colle", producer: "Gross", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 139, name: "Gross – Colle", producer: "Gross", vintage: "2015", region: "Štajerska Slovenija" },
  { id: 140, name: "Gross – Colle", producer: "Gross", vintage: "2017", region: "Štajerska Slovenija" },
  { id: 141, name: "Gross – Colle", producer: "Gross", vintage: "2016", region: "Štajerska Slovenija" },
  { id: 142, name: "Gross – Korze", producer: "Gross", vintage: "2018", region: "Štajerska Slovenija" },
  { id: 143, name: "Hedele – Sauvignon Goče", producer: "Hedele", vintage: "2018", region: "Vipavska Dolina" },
  { id: 144, name: "Hedele – Obelunec Sauvignon", producer: "Hedele", vintage: "2020", region: "Vipavska Dolina" },
  { id: 145, name: "Kobal – Sauvignon ULM", producer: "Kobal", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 146, name: "Marof – Sauvignon Goričko", producer: "Marof", vintage: "2021", region: "Prekmurje" },
  { id: 147, name: "Marof – Sauvignon Bodonci", producer: "Marof", vintage: "2021", region: "Prekmurje" },
  { id: 148, name: "Movia – Sauvignon", producer: "Movia", vintage: "2022", region: "Goriška brda" },
  { id: 149, name: "Movia – Veliko Sauvignon 1,5L", producer: "Movia", vintage: "2020", region: "Goriška brda" },
  { id: 150, name: "Nando – Sauvignon", producer: "Nando", vintage: "2009", region: "Goriška brda" },
  { id: 151, name: "Posestvo Bela Gora – Sauvignon Blanc", producer: "Posestvo Bela Gora", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 152, name: "Santei – Sauvignon", producer: "Santei", vintage: "2019", region: "Vipavska dolina" },
  { id: 153, name: "Šuklje – Lozice", producer: "Šuklje", vintage: "2022", region: "Bela Krajina" },
  { id: 154, name: "Šuman – Sauvignon Blanc", producer: "Šuman", vintage: "2000", region: "Štajerska Slovenija" },
  { id: 155, name: "Valdhuber – Jamertal Sauvignon", producer: "Valdhuber", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 156, name: "Verus – Sauvignon Blanc", producer: "Verus", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 157, name: "Blažič – Jakot", producer: "Blažič", vintage: "2018", region: "Goriška brda" },
  { id: 158, name: "Blažič – Jakot Plešivo", producer: "Blažič", vintage: "2021", region: "Goriška brda" },
  { id: 159, name: "JNK – Jakot.e", producer: "JNK", vintage: "2008", region: "Vipavska dolina" },
  { id: 160, name: "Klinec – Jakot", producer: "Klinec", vintage: "2020", region: "Goriška brda" },
  { id: 161, name: "Marjan Simčič – Sauvignon Vert Opoka", producer: "Marjan Simčič", vintage: "2018", region: "Goriška brda" },
  { id: 162, name: "Movia – Exto Gredič", producer: "Movia", vintage: "2020", region: "Goriška brda" },
  { id: 163, name: "Reja – Tolovaj", producer: "Reja", vintage: "2015", region: "Goriška brda" },
  { id: 164, name: "Reja – Tolovaj", producer: "Reja", vintage: "2019", region: "Goriška brda" },
  { id: 165, name: "Zanut – Jama", producer: "Zanut", vintage: "NV", region: "Goriška brda" },
  { id: 166, name: "Clos Veličane – Sivi Pinot", producer: "Clos Veličane", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 167, name: "Clos Veličane – Sivi Pinot", producer: "Clos Veličane", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 168, name: "Jure Štekar – Sivi pinot", producer: "Jure Štekar", vintage: "2021", region: "Goriška brda" },
  { id: 169, name: "Keltis – Sivi pinot", producer: "Keltis", vintage: "2018", region: "Bizeljsko-Sremič" },
  { id: 170, name: "Klinec – Gardelin", producer: "Klinec", vintage: "2020", region: "Goriška brda" },
  { id: 171, name: "Kralj – Sivi pinot", producer: "Kralj", vintage: "2016", region: "Štajerska Slovenija" },
  { id: 172, name: "Marjan Simčič – Sivi pinot selekcija", producer: "Marjan Simčič", vintage: "2020", region: "Goriška brda" },
  { id: 173, name: "Marof – Sivi Pinot Goričko", producer: "Marof", vintage: "2021", region: "Prekmurje" },
  { id: 174, name: "Roka – Sivi Pinot", producer: "Roka", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 175, name: "Šuman – Sivi Pinot", producer: "Šuman", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 176, name: "Dveri Pax – Šipon Ilovci", producer: "Dveri Pax", vintage: "2016", region: "Štajerska Slovenija" },
  { id: 177, name: "Gross – Iglič furmint", producer: "Gross", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 178, name: "Gross – Gorca", producer: "Gross", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 179, name: "Kobal – Šipon", producer: "Kobal", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 180, name: "Kobal – Šipon Roots", producer: "Kobal", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 181, name: "Lobik – Si Bon", producer: "Lobik", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 182, name: "Matic Wines – Šipon Amfora", producer: "Matic Wines", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 183, name: "Roka – Furmint", producer: "Roka", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 184, name: "Roka – Furmint", producer: "Roka", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 185, name: "Roka – Furmint", producer: "Roka", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 186, name: "Vinogradnistvo Kovačič – Šipon", producer: "Vinogradnistvo Kovačič", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 187, name: "Vinogradnistvo Kovačič – Šipon", producer: "Vinogradnistvo Kovačič", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 188, name: "Marko Fon – Vitovska Selekcija", producer: "Marko Fon", vintage: "2021", region: "Kras", byGlass: true },
  { id: 189, name: "Furlan – Vitovska", producer: "Furlan", vintage: "2015", region: "Vipavska dolina" },
  { id: 190, name: "Klet Čotova – Vitovska", producer: "Klet Čotova", vintage: "2018", region: "Kras" },
  { id: 191, name: "Marko Fon – Vitovska", producer: "Marko Fon", vintage: "2023", region: "Kras" },
  { id: 192, name: "Marko Fon – Vitovska", producer: "Marko Fon", vintage: "2021", region: "Kras" },
  { id: 193, name: "Marko Fon – Vitovska Selekcija 1,5L", producer: "Marko Fon", vintage: "2020", region: "Kras" },
  { id: 194, name: "Matej Švara – Vitovska", producer: "Matej Švara", vintage: "2022", region: "Kras" },
  { id: 195, name: "Matej Švara – Vitovska", producer: "Matej Švara", vintage: "2023", region: "Kras" },
  { id: 196, name: "Pietra – Vitovska \'Mandria\'", producer: "Pietra", vintage: "2019", region: "Kras" },
  { id: 197, name: "Pietra – Ska", producer: "Pietra", vintage: "2022", region: "Kras" },
  { id: 198, name: "Renčel – Vitovska", producer: "Renčel", vintage: "2017", region: "Kras" },
  { id: 199, name: "Slamič – Vitouska", producer: "Slamič", vintage: "2022", region: "Kras" },
  { id: 200, name: "Slamič – Vitouska", producer: "Slamič", vintage: "2021", region: "Kras" },
  { id: 201, name: "Štemberger – Vitovska", producer: "Štemberger", vintage: "2021", region: "Kras" },
  { id: 202, name: "Burja – Zelen", producer: "Burja", vintage: "2022", region: "Vipavska dolina" },
  { id: 203, name: "Ferjančič – Zelen", producer: "Ferjančič", vintage: "2019", region: "Vipavska dolina" },
  { id: 204, name: "Guerila – Zelen", producer: "Guerila", vintage: "2021", region: "Vipavska dolina" },
  { id: 205, name: "Guerila – Zelen", producer: "Guerila", vintage: "2023", region: "Vipavska dolina" },
  { id: 206, name: "Pasji rep – Zelen", producer: "Pasji rep", vintage: "2020", region: "Vipavska dolina" },
  { id: 207, name: "Pasji rep – Zelen", producer: "Pasji rep", vintage: "2021", region: "Vipavska dolina" },
  { id: 208, name: "Santei – Zelen", producer: "Santei", vintage: "2022", region: "Vipavska dolina" },
  { id: 209, name: "Štemberger – Zelen", producer: "Štemberger", vintage: "2021", region: "Kras" },
  { id: 210, name: "Bartol – Muskat Ottonel", producer: "Bartol", vintage: "2012", region: "Štajerska Slovenija" },
  { id: 211, name: "Batič – Laški rizling selekcija", producer: "Batič", vintage: "2020", region: "Vipavska dolina" },
  { id: 212, name: "Čotar – Bela", producer: "Čotar", vintage: "2020", region: "Kras" },
  { id: 213, name: "Dejan Kramberger – Zgodovina", producer: "Dejan Kramberger", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 214, name: "Ducal – Laški rizling", producer: "Ducal", vintage: "2018", region: "Štajerska Slovenija" },
  { id: 215, name: "Ducal – Laški rizling", producer: "Ducal", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 216, name: "Frelih – Zeleni Silvanec", producer: "Frelih", vintage: "2019", region: "Dolenjska" },
  { id: 217, name: "Kabaj – Beli pinot", producer: "Kabaj", vintage: "2018", region: "Goriška brda" },
  { id: 218, name: "Keltis – Muskat Ottonel", producer: "Keltis", vintage: "2021", region: "Bizeljsko-Sremič" },
  { id: 219, name: "Kralj – Laški rizling", producer: "Kralj", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 220, name: "Kralj – Zeleni silvanec", producer: "Kralj", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 221, name: "Prus – Kraljevina", producer: "Prus", vintage: "2017", region: "Bela krajina" },
  { id: 222, name: "Pucer Z Vrha – Rumeni Muškat", producer: "Pucer Z Vrha", vintage: "2020", region: "Slovenska Istra" },
  { id: 223, name: "Renesansa – Kerner", producer: "Renesansa", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 224, name: "Roka – Rumeni Muskat", producer: "Roka", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 225, name: "Roka – Traminec", producer: "Roka", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 226, name: "Šuman – Rumeni Muškat", producer: "Šuman", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 227, name: "Sveti Martin – Klarnica", producer: "Sveti Martin", vintage: "2017", region: "Vipavska dolina" },
  { id: 228, name: "Zorjan – Muskat Ottonel", producer: "Zorjan", vintage: "NV", region: "Štajerska Slovenija" },
  { id: 229, name: "Zorjan – Cuvee Ranina", producer: "Zorjan", vintage: "2006", region: "Štajerska Slovenija" },
  { id: 230, name: "Batič – Angel red", producer: "Batič", vintage: "2021", region: "Vipavska dolina" },
  { id: 231, name: "Čotar – Terra Rossa", producer: "Čotar", vintage: "2011", region: "Kras" },
  { id: 232, name: "Edi Simčič – Duet Lex", producer: "Edi Simčič", vintage: "2017", region: "Goriška brda" },
  { id: 233, name: "Edi Simčič – Kolos", producer: "Edi Simčič", vintage: "2020", region: "Goriška brda" },
  { id: 234, name: "Edi Simčič – Kolos", producer: "Edi Simčič", vintage: "2015", region: "Goriška brda" },
  { id: 235, name: "Edi Simčič – Kolos", producer: "Edi Simčič", vintage: "2016", region: "Goriška brda" },
  { id: 236, name: "Jakončič – Carolina Select", producer: "Jakončič", vintage: "2009", region: "Goriška brda" },
  { id: 237, name: "Jakončič – Carolina Select", producer: "Jakončič", vintage: "2011", region: "Goriška brda" },
  { id: 238, name: "Kabaj – Cuvee Morel", producer: "Kabaj", vintage: "2010", region: "Goriška brda" },
  { id: 239, name: "Keltis – Žan red", producer: "Keltis", vintage: "NV", region: "Bizeljsko-Sremič" },
  { id: 240, name: "Marof – Cuveé Breg 1,5L", producer: "Marof", vintage: "2017", region: "Prekmurje" },
  { id: 241, name: "Movia – Veliko rdeče", producer: "Movia", vintage: "2017", region: "Goriška brda" },
  { id: 242, name: "Movia – Veliko rdeče", producer: "Movia", vintage: "2012", region: "Goriška brda" },
  { id: 243, name: "Rurall – Dobro Rdeče", producer: "Rurall", vintage: "2018", region: "Slovenska Istra" },
  { id: 244, name: "Slavček – Viktorija Rose", producer: "Slavček", vintage: "NV", region: "Vipavska Dolina" },
  { id: 245, name: "Štemberger – B+", producer: "Štemberger", vintage: "2016", region: "Kras" },
  { id: 246, name: "Štemberger – B+", producer: "Štemberger", vintage: "2018", region: "Kras" },
  { id: 247, name: "Štokelj – Planta rdeča", producer: "Štokelj", vintage: "2019", region: "Vipavska dolina" },
  { id: 248, name: "Svetlik – Rdeče", producer: "Svetlik", vintage: "2016", region: "Vipavska dolina" },
  { id: 249, name: "UOU – Grjanc 9x", producer: "UOU", vintage: "2019", region: "Vipavska dolina" },
  { id: 250, name: "Batič – Cabernet Franc", producer: "Batič", vintage: "2018", region: "Vipavska dolina" },
  { id: 251, name: "Jure Štekar – Cabernet Franc", producer: "Jure Štekar", vintage: "2020", region: "Goriška brda" },
  { id: 252, name: "Čotar – Cabernet Sauvignon", producer: "Čotar", vintage: "2009", region: "Kras" },
  { id: 253, name: "Marjan Simčič – Cabernet Sauvignon", producer: "Marjan Simčič", vintage: "2018", region: "Goriška brda" },
  { id: 254, name: "Movia – Cabernet Sauvignon", producer: "Movia", vintage: "2018", region: "Goriška brda" },
  { id: 255, name: "Santomas – Cabernet Sauvignon Antonius", producer: "Santomas", vintage: "2014", region: "Slovenska Istra" },
  { id: 256, name: "Santomas – Cabernet Sauvignon", producer: "Santomas", vintage: "2019", region: "Slovenska Istra" },
  { id: 257, name: "Ferdinand – Merlot", producer: "Ferdinand", vintage: "2020", region: "Goriška brda" },
  { id: 258, name: "Iaquin – Merlot", producer: "Iaquin", vintage: "2015", region: "Goriška brda" },
  { id: 259, name: "JNK – Merlot", producer: "JNK", vintage: "2009", region: "Vipavska dolina" },
  { id: 260, name: "Kabaj – Merlot", producer: "Kabaj", vintage: "2014", region: "Goriška brda" },
  { id: 261, name: "Keltis – Merlot", producer: "Keltis", vintage: "2015", region: "Bizeljko-Sremič" },
  { id: 262, name: "Kmetija Mlečnik – Merlot", producer: "Kmetija Mlečnik", vintage: "2015", region: "Vipavska Dolina" },
  { id: 263, name: "Kupljen – Skywalker", producer: "Kupljen", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 264, name: "Marjan Simčič – Merlot Opoka", producer: "Marjan Simčič", vintage: "2016", region: "Goriška brda" },
  { id: 265, name: "Marof – Merlot", producer: "Marof", vintage: "2020", region: "Prekmurje" },
  { id: 266, name: "Santei – Merlot", producer: "Santei", vintage: "2020", region: "Vipavska dolina" },
  { id: 267, name: "Štokelj – Rose", producer: "Štokelj", vintage: "2022", region: "Vipavska dolina" },
  { id: 268, name: "VARDA – Merlot", producer: "VARDA", vintage: "2021", region: "Vipavska dolina" },
  { id: 269, name: "Zanut – Merlot Brjač", producer: "Zanut", vintage: "2009", region: "Goriška brda" },
  { id: 270, name: "Janes Colnar – Modra frankinja", producer: "Janes Colnar", vintage: "2019", region: "Bela krajina" },
  { id: 271, name: "Kobal – Blaufrankisch Roots", producer: "Kobal", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 272, name: "Kobal – Blaufrankisch Roots", producer: "Kobal", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 273, name: "Marof – Modra Frankinja", producer: "Marof", vintage: "2020", region: "Prekmurje" },
  { id: 274, name: "Matic Wines – Frankovka Amfora", producer: "Matic Wines", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 275, name: "Matic Wines – Frankovka Amfora", producer: "Matic Wines", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 276, name: "Posestvo Bela Gora – Modra Frankinja", producer: "Posestvo Bela Gora", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 277, name: "Prus – Modra Frankinja", producer: "Prus", vintage: "2018", region: "Bela krajina" },
  { id: 278, name: "Roka – Blaufränkisch", producer: "Roka", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 279, name: "Sanctum – Kartuzijansko rdeče", producer: "Sanctum", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 280, name: "Šuklje – Vrbanjka", producer: "Šuklje", vintage: "2020", region: "Bela krajina" },
  { id: 281, name: "Šuklje – Lodoma", producer: "Šuklje", vintage: "2021", region: "Bela krajina" },
  { id: 282, name: "Zorjan – Rdeče", producer: "Zorjan", vintage: "NV", region: "Štajerska Slovenija" },
  { id: 283, name: "Borut Anderlič – Red Star", producer: "Borut Anderlič", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 284, name: "Dveri pax – Modri pinot", producer: "Dveri pax", vintage: "2015", region: "Štajerska Slovenija" },
  { id: 285, name: "Frešer – Markus Modri", producer: "Frešer", vintage: "2019", region: "Štajerska Slovenija" },
  { id: 286, name: "Gross – Modri Pinot", producer: "Gross", vintage: "2022", region: "Štajerska Slovenija" },
  { id: 287, name: "Jakončič – Carolina Noir", producer: "Jakončič", vintage: "2017", region: "Goriška brda" },
  { id: 288, name: "Lendwines – Noir", producer: "Lendwines", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 289, name: "Lendwines – Pink Noir", producer: "Lendwines", vintage: "2023", region: "Štajerska Slovenija" },
  { id: 290, name: "Lipej – Modri pinot", producer: "Lipej", vintage: "2021", region: "Bizeljsko-Sremič" },
  { id: 291, name: "Meum – Pinot Noir Prestige", producer: "Meum", vintage: "2020", region: "Štajerska Slovenija" },
  { id: 292, name: "Movia – Modri pinot", producer: "Movia", vintage: "2020", region: "Goriška brda" },
  { id: 293, name: "Pasji rep – Modri pinot", producer: "Pasji rep", vintage: "2021", region: "Vipavska dolina" },
  { id: 294, name: "Renčel – Modri pinot", producer: "Renčel", vintage: "2016", region: "Kras" },
  { id: 295, name: "Šuman – Modri Pinot", producer: "Šuman", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 296, name: "Šumenjak – Modri pinot", producer: "Šumenjak", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 297, name: "Verus – Modri pinot", producer: "Verus", vintage: "2015", region: "Štajerska Slovenija" },
  { id: 298, name: "Čotar – Črna", producer: "Čotar", vintage: "2016", region: "Kras" },
  { id: 299, name: "Gordia – Refošk", producer: "Gordia", vintage: "2016", region: "Slovenska Istra" },
  { id: 300, name: "Klabjan – Refošk", producer: "Klabjan", vintage: "2017", region: "Slovenska Istra" },
  { id: 301, name: "Santomas – Grande Cuvée \'Certeze\'", producer: "Santomas", vintage: "2015", region: "Slovenska Istra" },
  { id: 302, name: "Slamič – Bastard", producer: "Slamič", vintage: "2020", region: "Kras" },
  { id: 303, name: "Tomaž Vodopivec – TKras", producer: "Tomaž Vodopivec", vintage: "2019", region: "Kras" },
  { id: 304, name: "Domaine Slapšak – Brut Nature ŽČ", producer: "Domaine Slapšak", vintage: "NV", region: "Dolenjska" },
  { id: 305, name: "Domaine Slapšak – Brut Rosé", producer: "Domaine Slapšak", vintage: "2019/2020", region: "Dolenjska" },
  { id: 306, name: "Klinec – Mora", producer: "Klinec", vintage: "2012", region: "Goriška brda", byGlass: true },
  { id: 307, name: "Jamšek – Barbera", producer: "Jamšek", vintage: "2016", region: "Vipavska dolina" },
  { id: 308, name: "Marko Fon – Lui", producer: "Marko Fon", vintage: "2020", region: "Kras" },
  { id: 309, name: "Marko Fon – Lui", producer: "Marko Fon", vintage: "2021", region: "Kras" },
  { id: 310, name: "Miška – Pokalca", producer: "Miška", vintage: "2019", region: "Vipavska dolina" },
  { id: 311, name: "Slamič – Teran", producer: "Slamič", vintage: "2022", region: "Kras" },
  { id: 312, name: "Domaine Slapšak – Brut Reserve", producer: "Domaine Slapšak", vintage: "2019/2020", region: "Dolenjska" },
  { id: 313, name: "Domaine Slapšak – T16 1,5L", producer: "Domaine Slapšak", vintage: "2016", region: "Dolenjska" },
  { id: 314, name: "Domaine Slapšak – T16", producer: "Domaine Slapšak", vintage: "2016", region: "Dolenjska" },
  { id: 315, name: "Ducal – Brut", producer: "Ducal", vintage: "2021", region: "Štajerska" },
  { id: 316, name: "Lobik – Belavšek Rouz", producer: "Lobik", vintage: "2021", region: "Štajerska Slovenija" },
  { id: 317, name: "Slavček – Viktorija Bela", producer: "Slavček", vintage: "NV", region: "Goriška brda" },
  { id: 318, name: "Milka – \'SFSC\' (Non-alc)", producer: "Milka", vintage: "", region: "Kranjska Gora", byGlass: true },
  { id: 319, name: "Domaine Wachau – Grüner Veltliner Smaragd", producer: "Domaine Wachau", vintage: "2023", region: "Wachau, AT" },
  { id: 320, name: "F.X. Pichler – Dürnsteiner Grüner Veltliner", producer: "F.X. Pichler", vintage: "2015", region: "Wachau, AT" },
  { id: 321, name: "Gut Oggau – Theodora Weiss", producer: "Gut Oggau", vintage: "2023", region: "Burgenland, AT" },
  { id: 322, name: "Karl Schnabel – Silicum", producer: "Karl Schnabel", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 323, name: "Neue Heimat – Ried Sernau Charakter", producer: "Neue Heimat", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 324, name: "Neue Heimat – Charakter", producer: "Neue Heimat", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 325, name: "Andreas & Elisabeth Tscheppe – Salamander", producer: "Andreas & Elisabeth Tscheppe", vintage: "2023", region: "Südsteiermark, AT", byGlass: true },
  { id: 326, name: "Alice & Rolan Tauss – Chardonnay Opok", producer: "Alice & Rolan Tauss", vintage: "2024", region: "Südsteiermark, AT" },
  { id: 327, name: "Alice & Rolan Tauss – Chardonnay Hohenegg", producer: "Alice & Rolan Tauss", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 328, name: "Andreas & Elisabeth Tscheppe – Salamander", producer: "Andreas & Elisabeth Tscheppe", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 329, name: "Harkamp – Kogelwenzel Morillon", producer: "Harkamp", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 330, name: "Karl Schnabel – Morillon Hochegg", producer: "Karl Schnabel", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 331, name: "Alice & Rolan Tauss – Welschriesling Opok", producer: "Alice & Rolan Tauss", vintage: "2024", region: "Südsteiermark, AT" },
  { id: 332, name: "Domaine Wachau – Riesling Amfora", producer: "Domaine Wachau", vintage: "2022", region: "Wachau, AT" },
  { id: 333, name: "F.X. Pichler – Ried Loibenberg Smaragd", producer: "F.X. Pichler", vintage: "2018", region: "Wachau, AT" },
  { id: 334, name: "F.X. Pichler – Durnsteiner Liebenberg", producer: "F.X. Pichler", vintage: "2018", region: "Wachau, AT" },
  { id: 335, name: "Harkamp – Terra Cotta Welschriesling", producer: "Harkamp", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 336, name: "Harkamp – Substance Riesling", producer: "Harkamp", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 337, name: "Harkamp – Pure Riesling", producer: "Harkamp", vintage: "NV", region: "Südsteiermark, AT" },
  { id: 338, name: "Alice & Rolan Tauss – Sauvignon Opok", producer: "Alice & Rolan Tauss", vintage: "2024", region: "Südsteiermark, AT" },
  { id: 339, name: "Alice & Rolan Tauss – Sauvignon Urban", producer: "Alice & Rolan Tauss", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 340, name: "Alice & Rolan Tauss – Sauvignon Hohenegg", producer: "Alice & Rolan Tauss", vintage: "2023", region: "Südsteiermark, AT" },
  { id: 341, name: "Andreas & Elisabeth Tscheppe – Blaue Libelle", producer: "Andreas & Elisabeth Tscheppe", vintage: "2023", region: "Südsteiermark, AT" },
  { id: 342, name: "Andreas & Elisabeth Tscheppe – Blaue Libelle", producer: "Andreas & Elisabeth Tscheppe", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 343, name: "Andreas & Elisabeth Tscheppe – Grüne Libelle", producer: "Andreas & Elisabeth Tscheppe", vintage: "2023", region: "Südsteiermark, AT" },
  { id: 344, name: "Andreas & Elisabeth Tscheppe – Blaue Libelle Plus", producer: "Andreas & Elisabeth Tscheppe", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 345, name: "Andreas & Elisabeth Tscheppe – Grüne Libelle Plus", producer: "Andreas & Elisabeth Tscheppe", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 346, name: "Harkamp – Terra Cotta Sauvignon Blanc", producer: "Harkamp", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 347, name: "Harkamp – Substance Sauvignon Blanc", producer: "Harkamp", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 348, name: "Harkamp – Pure Sauvignon Blanc", producer: "Harkamp", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 349, name: "Karl Schnabel – Sauvignon Blanc Legionär", producer: "Karl Schnabel", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 350, name: "Maria & Sepp Muster – Graf Sauvignon", producer: "Maria & Sepp Muster", vintage: "2019", region: "Südsteiermark, AT" },
  { id: 351, name: "Neue Heimat – Intuition Sauvignon", producer: "Neue Heimat", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 352, name: "Neue Heimat – Intuition Sauvignon", producer: "Neue Heimat", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 353, name: "Rabusella – Sauvignon", producer: "Rabusella", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 354, name: "Rabusella – Sauvignon", producer: "Rabusella", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 355, name: "Rabusella – Sauvignon Grete", producer: "Rabusella", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 356, name: "Rabusella – Sauvignon Grete", producer: "Rabusella", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 357, name: "Rabusella – Portal", producer: "Rabusella", vintage: "2012", region: "Südsteiermark, AT" },
  { id: 358, name: "Andreas & Elisabeth Tscheppe – Schwalbenschwanz", producer: "Andreas & Elisabeth Tscheppe", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 359, name: "Andreas & Elisabeth Tscheppe – Segelfalter", producer: "Andreas & Elisabeth Tscheppe", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 360, name: "Gut Oggau – Emmeram Weiss", producer: "Gut Oggau", vintage: "2023", region: "Burgenland, AT" },
  { id: 361, name: "Karl Schnabel – Gelber Muskateller", producer: "Karl Schnabel", vintage: "2023", region: "Südsteiermark, AT" },
  { id: 362, name: "Kobatl – My Dirty Siva", producer: "Kobatl", vintage: "2021", region: "Vulkanland Steiermark, AT" },
  { id: 363, name: "Kobatl – Rumble in the Jungle", producer: "Kobatl", vintage: "2021", region: "Vulkanland Steiermark, AT" },
  { id: 364, name: "Kobatl – Flower Power", producer: "Kobatl", vintage: "2020", region: "Vulkanland Steiermark, AT" },
  { id: 365, name: "Kobatl – Flower Power", producer: "Kobatl", vintage: "2022", region: "Vulkanland Steiermark, AT" },
  { id: 366, name: "Kobatl – Rumble in the Jungle", producer: "Kobatl", vintage: "2022", region: "Vulkanland Steiermark, AT" },
  { id: 367, name: "Kobatl – My Dirty Siva", producer: "Kobatl", vintage: "2022", region: "Vulkanland Steiermark, AT" },
  { id: 368, name: "Kobatl – Out Of Space", producer: "Kobatl", vintage: "2022", region: "Vulkanland Steiermark, AT" },
  { id: 369, name: "Kobatl – T.R.F", producer: "Kobatl", vintage: "2019", region: "Vulkanland Steiermark, AT" },
  { id: 370, name: "Kobatl – Whole Bunch", producer: "Kobatl", vintage: "2022", region: "Vulkanland Steiermark, AT" },
  { id: 371, name: "Neue Heimat – Intuition Muskateller", producer: "Neue Heimat", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 372, name: "Neue Heimat – Gelber Muskateller Brut", producer: "Neue Heimat", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 373, name: "Neue Heimat – Gamlitz Gelber Muskateller", producer: "Neue Heimat", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 374, name: "Rabusella – Weißburgunder", producer: "Rabusella", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 375, name: "Rabusella – Weißburgunder", producer: "Rabusella", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 376, name: "Strohmeier – TLZ Indigo no2", producer: "Strohmeier", vintage: "2017", region: "Schilcherland Steiermark, AT" },
  { id: 377, name: "Gut Oggau – Joshuari", producer: "Gut Oggau", vintage: "2022", region: "Burgenland, AT", byGlass: true },
  { id: 378, name: "Harkamp – Substance Pinot Noir", producer: "Harkamp", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 379, name: "Karl Schnabel – Pinot Noir Koregg", producer: "Karl Schnabel", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 380, name: "Karl Schnabel – Pinot Noir Hochegg", producer: "Karl Schnabel", vintage: "2022", region: "Südsteiermark, AT" },
  { id: 381, name: "Neue Heimat – Aspekt Pinot Noir", producer: "Neue Heimat", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 382, name: "Neue Heimat – Pinot Noir", producer: "Neue Heimat", vintage: "2020", region: "Südsteiermark, AT" },
  { id: 383, name: "Karl Schnabel – Rosé", producer: "Karl Schnabel", vintage: "2021", region: "Südsteiermark, AT" },
  { id: 384, name: "Harkamp – Solera V Reserve", producer: "Harkamp", vintage: "NV", region: "Südsteiermark, AT" },
  { id: 385, name: "Harkamp – Brut Reserve", producer: "Harkamp", vintage: "NV", region: "Südsteiermark, AT" },
  { id: 386, name: "Damijan Podveršič – Kaplja", producer: "Damijan Podveršič", vintage: "2020", region: "Friuli, IT" },
  { id: 387, name: "Edi Keber – Collio Bianco", producer: "Edi Keber", vintage: "2020", region: "Friuli, IT" },
  { id: 388, name: "Marta Venica – Collio Bianco", producer: "Marta Venica", vintage: "2022", region: "Friuli, IT" },
  { id: 389, name: "Marta Venica – Giardino del Monte", producer: "Marta Venica", vintage: "2022", region: "Friuli, IT" },
  { id: 390, name: "Nikolas Juretic – Verjan", producer: "Nikolas Juretic", vintage: "2023", region: "Cornos, IT" },
  { id: 391, name: "Nikolas Juretic – Grande Waldo", producer: "Nikolas Juretic", vintage: "2023", region: "Cornos, IT" },
  { id: 392, name: "Peter Radovič – Inkanto", producer: "Peter Radovič", vintage: "2023", region: "Carso, IT" },
  { id: 393, name: "Peter Radovič – Inkanto", producer: "Peter Radovič", vintage: "2022", region: "Carso, IT" },
  { id: 394, name: "Ronchi di Cialla – Bianco di Cialla", producer: "Ronchi di Cialla", vintage: "2022", region: "Friuli, IT" },
  { id: 395, name: "Škerk – Ograde", producer: "Škerk", vintage: "2020", region: "Friuli, IT" },
  { id: 396, name: "Škerk – Ograde", producer: "Škerk", vintage: "2021", region: "Friuli, IT" },
  { id: 397, name: "Terpin – Quinto Quarto", producer: "Terpin", vintage: "NV", region: "Friuli, IT" },
  { id: 398, name: "Zidarich – Prulke", producer: "Zidarich", vintage: "2021", region: "Carso, IT" },
  { id: 399, name: "La Castellada – Chardonnay", producer: "La Castellada", vintage: "2018", region: "Friuli, IT" },
  { id: 400, name: "La Castellada – Chardonnay 1,5L", producer: "La Castellada", vintage: "2018", region: "Friuli, IT" },
  { id: 401, name: "D. Gaggiola – Fuorizona", producer: "D. Gaggiola", vintage: "2022", region: "Cormons, IT" },
  { id: 402, name: "Damijan Podveršič – Malvazija", producer: "Damijan Podveršič", vintage: "2020", region: "Friuli, IT" },
  { id: 403, name: "Peter Radovič – Malavizija", producer: "Peter Radovič", vintage: "2021", region: "Carso, IT" },
  { id: 404, name: "Peter Radovič – Malavizija", producer: "Peter Radovič", vintage: "2022", region: "Carso, IT" },
  { id: 405, name: "Peter Radovič – Soline", producer: "Peter Radovič", vintage: "2023", region: "Carso, IT" },
  { id: 406, name: "Peter Radovič – Malavizija", producer: "Peter Radovič", vintage: "2023", region: "Carso, IT" },
  { id: 407, name: "Škerk – Malvazija", producer: "Škerk", vintage: "2020", region: "Friuli, IT" },
  { id: 408, name: "Skerlj – Malvasia IGT", producer: "Skerlj", vintage: "2022", region: "Friuli, IT" },
  { id: 409, name: "Skerlj – Malvasia DOC", producer: "Skerlj", vintage: "2022", region: "Friuli, IT" },
  { id: 410, name: "Gravner – Ribolla Breg", producer: "Gravner", vintage: "2016", region: "Friuli, IT", byGlass: true },
  { id: 411, name: "Damijan Podveršič – Ribolla Gialla", producer: "Damijan Podveršič", vintage: "2020", region: "Friuli, IT" },
  { id: 412, name: "Dario Prinčič – Ribolla Gialla", producer: "Dario Prinčič", vintage: "2017", region: "Friuli, IT" },
  { id: 413, name: "Gravner – Ribolla Breg", producer: "Gravner", vintage: "2014", region: "Friuli, IT" },
  { id: 414, name: "Gravner – Ribolla Breg", producer: "Gravner", vintage: "2007", region: "Friuli, IT" },
  { id: 415, name: "La Castellada – Ribolla Gialla", producer: "La Castellada", vintage: "2017", region: "Friuli, IT" },
  { id: 416, name: "Radikon – Ribolla 1,0L", producer: "Radikon", vintage: "2016", region: "Friuli, IT" },
  { id: 417, name: "Ronco Severo – Ribolla Gialla", producer: "Ronco Severo", vintage: "2022", region: "Friuli, IT" },
  { id: 418, name: "Borgo del Tiglio – Sauvignon", producer: "Borgo del Tiglio", vintage: "2023", region: "Friuli, IT" },
  { id: 419, name: "Cantina Terlan – Quarz", producer: "Cantina Terlan", vintage: "2023", region: "Alto Adige, IT" },
  { id: 420, name: "Cantina Terlan – Winkl", producer: "Cantina Terlan", vintage: "2022", region: "Alto Adige, IT" },
  { id: 421, name: "La Castellada – Sauvignon Blanc", producer: "La Castellada", vintage: "2018", region: "Friuli, IT" },
  { id: 422, name: "La Castellada – Sauvignon Blanc 1,5L", producer: "La Castellada", vintage: "2018", region: "Friuli, IT" },
  { id: 423, name: "Mitja Sirk – Bianco", producer: "Mitja Sirk", vintage: "2023", region: "Friuli, IT", byGlass: true },
  { id: 424, name: "Damijan Podveršič – Nekaj", producer: "Damijan Podveršič", vintage: "2019", region: "Friuli, IT" },
  { id: 425, name: "Dario Prinčič – Jakot", producer: "Dario Prinčič", vintage: "2017", region: "Friuli, IT" },
  { id: 426, name: "La Castellada – Friulano", producer: "La Castellada", vintage: "2017", region: "Friuli, IT" },
  { id: 427, name: "Mitja Sirk – Ca\'Savorgnan", producer: "Mitja Sirk", vintage: "2022", region: "Friuli, IT" },
  { id: 428, name: "Mitja Sirk – Meden", producer: "Mitja Sirk", vintage: "2022", region: "Friuli, IT" },
  { id: 429, name: "Nikolas Juretic – Mont", producer: "Nikolas Juretic", vintage: "2023", region: "Cornos, IT" },
  { id: 430, name: "Okus – Bianco", producer: "Okus", vintage: "2023", region: "Cormons, IT" },
  { id: 431, name: "Ronco Severo – Friulano", producer: "Ronco Severo", vintage: "2022", region: "Friuli, IT" },
  { id: 432, name: "La Castellada – Sivi Pinot", producer: "La Castellada", vintage: "2018", region: "Friuli, IT" },
  { id: 433, name: "Ronco Severo – Pinot Grigio", producer: "Ronco Severo", vintage: "2021", region: "Friuli, IT" },
  { id: 434, name: "Ronco Severo – Pinot Grigio", producer: "Ronco Severo", vintage: "2022", region: "Friuli, IT" },
  { id: 435, name: "Peter Radovič – Vitovska", producer: "Peter Radovič", vintage: "2022", region: "Carso, IT" },
  { id: 436, name: "Peter Radovič – Vitovska", producer: "Peter Radovič", vintage: "2023", region: "Carso, IT" },
  { id: 437, name: "Škerk – Vitovska", producer: "Škerk", vintage: "2019", region: "Friuli, IT" },
  { id: 438, name: "Skerlj – Vitovska IGT", producer: "Skerlj", vintage: "2022", region: "Friuli, IT" },
  { id: 439, name: "Skerlj – Vitovska DOC", producer: "Skerlj", vintage: "2022", region: "Friuli, IT" },
  { id: 440, name: "Vodopivec – Vitovska", producer: "Vodopivec", vintage: "2018", region: "Carso, IT" },
  { id: 441, name: "Vodopivec – Vitovska Origine", producer: "Vodopivec", vintage: "2018", region: "Carso, IT" },
  { id: 442, name: "Zidarich – Vitovska", producer: "Zidarich", vintage: "2018", region: "Carso, IT" },
  { id: 443, name: "Zidarich – Kamen", producer: "Zidarich", vintage: "2021", region: "Carso, IT" },
  { id: 444, name: "Casa Coste Piane – Valdobbiadene Prosecco", producer: "Casa Coste Piane", vintage: "NV", region: "Prosecco, IT" },
  { id: 445, name: "Denis Montanar – Verduzzo", producer: "Denis Montanar", vintage: "2017", region: "Friuli, IT" },
  { id: 446, name: "Denis Montanar – Verduzzo", producer: "Denis Montanar", vintage: "2018", region: "Friuli, IT" },
  { id: 447, name: "La Castellada – Bianco della Castellada", producer: "La Castellada", vintage: "2017", region: "Friuli, IT" },
  { id: 448, name: "Ronchi di Cialla – SÔL", producer: "Ronchi di Cialla", vintage: "2009", region: "Friuli, IT" },
  { id: 449, name: "Ronchi di Cialla – Verduzzo", producer: "Ronchi di Cialla", vintage: "2020", region: "Friuli, IT" },
  { id: 450, name: "Nikolas Juretic – Rosso", producer: "Nikolas Juretic", vintage: "2023", region: "Cornos, IT" },
  { id: 451, name: "Ronchi di Cialla – Rosso di Cialla", producer: "Ronchi di Cialla", vintage: "2021", region: "Friuli, IT" },
  { id: 452, name: "Ronco Severo – Schioppettino", producer: "Ronco Severo", vintage: "2021", region: "Friuli, IT" },
  { id: 453, name: "Terpin – Quinto Quarto Rosso", producer: "Terpin", vintage: "NV", region: "Friuli, IT" },
  { id: 454, name: "Okus – Rosso", producer: "Okus", vintage: "2022", region: "Cormons, IT" },
  { id: 455, name: "Ronco Severo – Artiùl", producer: "Ronco Severo", vintage: "2019", region: "Friuli, IT" },
  { id: 456, name: "Primaradice – La Boemia Sul Mare", producer: "Primaradice", vintage: "2022", region: "Friuli, IT" },
  { id: 457, name: "Primaradice – L\'Importanza Di Essere Franco", producer: "Primaradice", vintage: "2023", region: "Friuli, IT" },
  { id: 458, name: "Alois Lageder – Pinot Noir IGT", producer: "Alois Lageder", vintage: "2022", region: "Alto Adige, IT" },
  { id: 459, name: "Cantina Terlan – Monticol", producer: "Cantina Terlan", vintage: "2021", region: "Alto Adige, IT" },
  { id: 460, name: "Cantina Terlan – Porphyr", producer: "Cantina Terlan", vintage: "2021", region: "Alto Adige, IT" },
  { id: 461, name: "Denis Montanar – Refosco dal Peduncolo Rosso", producer: "Denis Montanar", vintage: "2017", region: "Friuli, IT" },
  { id: 462, name: "Denis Montanar – Roi Sombre Rosso", producer: "Denis Montanar", vintage: "2019", region: "Friuli, IT" },
  { id: 463, name: "Ronchi di Cialla – Refosco dal Peduncolo Rosso", producer: "Ronchi di Cialla", vintage: "2015", region: "Friuli, IT" },
  { id: 464, name: "Ronchi di Cialla – Refosco dal Peduncolo Rosso", producer: "Ronchi di Cialla", vintage: "2012", region: "Friuli, IT" },
  { id: 465, name: "Ronco Severo – Refosco", producer: "Ronco Severo", vintage: "2021", region: "Friuli, IT" },
  { id: 466, name: "Damijan Podveršič – Prelite", producer: "Damijan Podveršič", vintage: "2020", region: "Friuli, IT" },
  { id: 467, name: "Gravner – Rosso Breg (Pignolo)", producer: "Gravner", vintage: "2007", region: "Friuli, IT" },
  { id: 468, name: "La Castellada – Rosso della Castellada", producer: "La Castellada", vintage: "2015", region: "Friuli, IT" },
  { id: 469, name: "Peter Radovič – Teran", producer: "Peter Radovič", vintage: "2021", region: "Carso, IT" },
  { id: 470, name: "Peter Radovič – Teran", producer: "Peter Radovič", vintage: "2022", region: "Carso, IT" },
  { id: 471, name: "Radikon – Pignoli 1,0L", producer: "Radikon", vintage: "2009", region: "Friuli, IT" },
  { id: 472, name: "Ronchi di Cialla – Schioppettino", producer: "Ronchi di Cialla", vintage: "2018", region: "Friuli, IT" },
  { id: 473, name: "Ronchi di Cialla – Schioppettino", producer: "Ronchi di Cialla", vintage: "2014", region: "Friuli, IT" },
  { id: 474, name: "Zidarich – Zi-Da", producer: "Zidarich", vintage: "2019", region: "Carso, IT" },
  { id: 475, name: "Zidarich – Teran", producer: "Zidarich", vintage: "2021", region: "Carso, IT" },
  { id: 476, name: "Floribunda – Apple", producer: "Floribunda", vintage: "2023", region: "Friuli, IT" },
  { id: 477, name: "Floribunda – Quince", producer: "Floribunda", vintage: "2023", region: "Friuli, IT" },
  { id: 478, name: "Floribunda – Apple Rosé", producer: "Floribunda", vintage: "2023", region: "Friuli, IT" },
  { id: 479, name: "Domaine de Montbourgeau – Cuvée Spéciale", producer: "Domaine de Montbourgeau", vintage: "2017", region: "Jura, FR" },
  { id: 480, name: "Domaine Pierre V. Girardin – Savagnin Le Noyer", producer: "Domaine Pierre V. Girardin", vintage: "2023", region: "Burgundija, FR" },
  { id: 481, name: "Paul Clouet – Rose Extra Brut", producer: "Paul Clouet", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 482, name: "Romain et Pascal Henin – Le Gamin du Terroir", producer: "Romain et Pascal Henin", vintage: "2018", region: "Vallée de la Marne, FR" },
  { id: 483, name: "Romain et Pascal Henin – Le Gamin du Terroir", producer: "Romain et Pascal Henin", vintage: "2019", region: "Vallée de la Marne, FR" },
  { id: 484, name: "Théo Dancer – Jurassique", producer: "Théo Dancer", vintage: "2023", region: "Burgundija, FR" },
  { id: 485, name: "Clandestin – Les Revers", producer: "Clandestin", vintage: "2020", region: "Côte des Bar, FR", byGlass: true },
  { id: 486, name: "Chavost – Paradoxe", producer: "Chavost", vintage: "2019-2023", region: "Vallée de la Marne, FR", byGlass: true },
  { id: 487, name: "Jérémy Recchione – Hautes Côtes de Nuits blanc", producer: "Jérémy Recchione", vintage: "2023", region: "Burgundija, FR", byGlass: true },
  { id: 488, name: "Antoine Jobard – Meursault Les Gouttes d\'Or 1er cru", producer: "Antoine Jobard", vintage: "2022", region: "Burgundija, FR", byGlass: true },
  { id: 489, name: "Antoine Jobard – Pommard Epenots 1er Cru", producer: "Antoine Jobard", vintage: "2022", region: "Burgundija, FR" },
  { id: 490, name: "Antoine Jobard – Meursault-Genevrieres 1er cru", producer: "Antoine Jobard", vintage: "2022", region: "Burgundija, FR" },
  { id: 491, name: "Antoine Jobard – Beaune Epenottes 1er cru", producer: "Antoine Jobard", vintage: "2022", region: "Burgundija, FR" },
  { id: 492, name: "Aurore Casanova – Chardonnay Grand Cru", producer: "Aurore Casanova", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 493, name: "Benoît Munier – Cramant", producer: "Benoît Munier", vintage: "2018", region: "Côte des Blancs, FR" },
  { id: 494, name: "Benoît Munier – Bouzy/Cramant", producer: "Benoît Munier", vintage: "2018", region: "Côte des Blancs, FR" },
  { id: 495, name: "Billecart Salmon – Blanc de Blancs", producer: "Billecart Salmon", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 496, name: "Bonnaire – Terroirs BDB Grand Cru", producer: "Bonnaire", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 497, name: "Bonnaire – Cramant", producer: "Bonnaire", vintage: "2015", region: "Côte des Blancs, FR" },
  { id: 498, name: "Château Béru – Côte aux Prêtes", producer: "Château Béru", vintage: "2020", region: "Burgundy, FR" },
  { id: 499, name: "Chavost – Blanc de Chardonnay", producer: "Chavost", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 500, name: "Chavost – Coteaux champenois", producer: "Chavost", vintage: "2020", region: "Vallée de la Marne, FR" },
  { id: 501, name: "Clandestin – Les Grandes Lignes", producer: "Clandestin", vintage: "2020", region: "Côte des Bar, FR" },
  { id: 502, name: "Clarisse de Suremain – Arpète", producer: "Clarisse de Suremain", vintage: "2023", region: "Burgundy, FR" },
  { id: 503, name: "Clarisse de Suremain – Pernand-Vergelesses", producer: "Clarisse de Suremain", vintage: "2022", region: "Burgundy, FR" },
  { id: 504, name: "Domaine de Montbourgeau – L\'Étoile La Chaux", producer: "Domaine de Montbourgeau", vintage: "2022", region: "Jura, FR" },
  { id: 505, name: "Domaine de Montbourgeau – L\'Étoile Courbette", producer: "Domaine de Montbourgeau", vintage: "2022", region: "Jura, FR" },
  { id: 506, name: "Domaine de Montbourgeau – L\'Étoile", producer: "Domaine de Montbourgeau", vintage: "2019", region: "Jura, FR" },
  { id: 507, name: "Domaine Duroche – Bourgogne Côte d\'Or", producer: "Domaine Duroche", vintage: "2023", region: "Burgundija, FR" },
  { id: 508, name: "Domaine Fourrier – Vougeot Les Petits Vougeots 1er cru", producer: "Domaine Fourrier", vintage: "2017", region: "Burgundija, FR" },
  { id: 509, name: "Domaine Hubert Lamy – Saint Aubin 1C Les Frionnes", producer: "Domaine Hubert Lamy", vintage: "2023", region: "Burgundija, FR" },
  { id: 510, name: "Domaine Macle – Chardonnay sous voile", producer: "Domaine Macle", vintage: "2015", region: "Jura, FR" },
  { id: 511, name: "Domaine Marc Morey & Fils – Chassagne-Montrachet 1er Cru En Virondot", producer: "Domaine Marc Morey & Fils", vintage: "2016", region: "Burgundija, FR" },
  { id: 512, name: "Domaine Pierre V. Girardin – Corton Charlemagne La Croix", producer: "Domaine Pierre V. Girardin", vintage: "2023", region: "Burgundija, FR" },
  { id: 513, name: "Domaine Pierre V. Girardin – Meursault Les Grandes Charrons", producer: "Domaine Pierre V. Girardin", vintage: "2022", region: "Burgundija, FR" },
  { id: 514, name: "Domaine Vincent Dancer – Chassagne Montrachet 1er cru Tete du Clos blanc", producer: "Domaine Vincent Dancer", vintage: "2023", region: "Burgundija, FR" },
  { id: 515, name: "Fleury – CÔTEAUX CHAMPENOIS", producer: "Fleury", vintage: "2021", region: "Côteaux Champenois, FR" },
  { id: 516, name: "Francois Nicolay – Mâcon Village", producer: "Francois Nicolay", vintage: "2022", region: "Burgundija, FR" },
  { id: 517, name: "Francois Nicolay – Coteaux de Champlitte", producer: "Francois Nicolay", vintage: "2022", region: "Burgundija, FR" },
  { id: 518, name: "Godmé-Guillaume – Terre de Verzy", producer: "Godmé-Guillaume", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 519, name: "Godmé-Guillaume – Terre de Villers-Marmery", producer: "Godmé-Guillaume", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 520, name: "Gosset – Blanc de Blancs", producer: "Gosset", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 521, name: "Jacques Lassaigne – Les Vignes de Montgueux", producer: "Jacques Lassaigne", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 522, name: "Jacquesson – Avize Champ Cain", producer: "Jacquesson", vintage: "2009", region: "Vallée de la Marne, FR" },
  { id: 523, name: "Jeaunaux-Robin – Les Marnes Blanches", producer: "Jeaunaux-Robin", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 524, name: "Jérémy Recchione – Pernand Vergelesses 1er cru Blanc", producer: "Jérémy Recchione", vintage: "2022", region: "Burgundija, FR" },
  { id: 525, name: "Jérémy Recchione – Hautes Côtes de Nuits blanc", producer: "Jérémy Recchione", vintage: "2022", region: "Burgundija, FR" },
  { id: 526, name: "La Soufrandière – Saint-Véran \'La Combe Desroches\'", producer: "La Soufrandière", vintage: "2023", region: "Burgundija, FR" },
  { id: 527, name: "La Soufrandière – Pouilly-Fuissé \'En Chantenay\'", producer: "La Soufrandière", vintage: "2023", region: "Burgundija, FR" },
  { id: 528, name: "Lamiable – Pheerie", producer: "Lamiable", vintage: "2017", region: "Vallée de la Marne, FR" },
  { id: 529, name: "Larmandier-Bernier – Longitude Premier Cru BDB", producer: "Larmandier-Bernier", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 530, name: "Larmandier-Bernier – Latitude Extra-Brut BDB", producer: "Larmandier-Bernier", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 531, name: "Louis Latour – Grand Ardeche", producer: "Louis Latour", vintage: "2020", region: "Ardeche, FR" },
  { id: 532, name: "Marc Colin – Bourgogne Blanc", producer: "Marc Colin", vintage: "2019", region: "Burgundija, FR" },
  { id: 533, name: "Maria et Vincent Tricot – Désiré", producer: "Maria et Vincent Tricot", vintage: "2023", region: "Auvergne, FR" },
  { id: 534, name: "Marie Courtin – Éloquence", producer: "Marie Courtin", vintage: "2018", region: "Côte des Bar, FR" },
  { id: 535, name: "Marthe Henry – Bourgogne Blanc", producer: "Marthe Henry", vintage: "2021", region: "Burgundija, FR" },
  { id: 536, name: "Michael Brugnon – Blanc de Blanc", producer: "Michael Brugnon", vintage: "2018", region: "Montagne de Reims, FR" },
  { id: 537, name: "Mouzon Leroux – L\'Angélique", producer: "Mouzon Leroux", vintage: "2017", region: "Montagne de Reims, FR" },
  { id: 538, name: "Olivier Bonville – Odysse 319 BdB Grand Cru", producer: "Olivier Bonville", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 539, name: "Olivier Leflaive – 1er Cru Fourchaume", producer: "Olivier Leflaive", vintage: "2023", region: "Burgundija, FR" },
  { id: 540, name: "Olivier Leflaive – Santenay Blanc", producer: "Olivier Leflaive", vintage: "2020", region: "Burgundija, FR" },
  { id: 541, name: "Olivier Leflaive – 1er Cru Montee de Tonnerre", producer: "Olivier Leflaive", vintage: "2022", region: "Burgundija, FR" },
  { id: 542, name: "Pascal Agrapart & Fils – Avizoise Grand Cru", producer: "Pascal Agrapart & Fils", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 543, name: "Pascal Agrapart & Fils – Mineral Grand Cru", producer: "Pascal Agrapart & Fils", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 544, name: "Pascal Agrapart & Fils – Terroirs Grand Cru", producer: "Pascal Agrapart & Fils", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 545, name: "Pascal Agrapart & Fils – Venus Grand Cru", producer: "Pascal Agrapart & Fils", vintage: "2018", region: "Côte des Blancs, FR" },
  { id: 546, name: "Pertois-Moriset – Le Special Club BdB", producer: "Pertois-Moriset", vintage: "2014", region: "Côte des Blancs, FR" },
  { id: 547, name: "Pertois-Moriset – Les Quatre Terroirs BdB", producer: "Pertois-Moriset", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 548, name: "Pertois-Moriset – Les Hautes Mottes", producer: "Pertois-Moriset", vintage: "2015", region: "Côte des Blancs, FR" },
  { id: 549, name: "Pertois-Moriset – Les Hautes d\'Aillerands", producer: "Pertois-Moriset", vintage: "2015", region: "Côte des Blancs, FR" },
  { id: 550, name: "Robert Denogent – Pouilly-Fuissé \'La Croix\'", producer: "Robert Denogent", vintage: "2022", region: "Burgundy, FR" },
  { id: 551, name: "Romain et Pascal Henin – La Treve", producer: "Romain et Pascal Henin", vintage: "2019", region: "Vallée de la Marne, FR" },
  { id: 552, name: "Sacy Soeur & Frère – Les Chardonnays de Verzy GC", producer: "Sacy Soeur & Frère", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 553, name: "Salima et Alain Cordeuil – Altitude 350m", producer: "Salima et Alain Cordeuil", vintage: "2019", region: "Côte des Bar, FR" },
  { id: 554, name: "Salon – Vintage 2013", producer: "Salon", vintage: "2013", region: "Côte des Blancs, FR" },
  { id: 555, name: "Stephane Regnault – Chromatique BdB", producer: "Stephane Regnault", vintage: "2019", region: "Côte des Blancs, FR" },
  { id: 556, name: "Thomas de Marne – Coteaux Champenois", producer: "Thomas de Marne", vintage: "2022", region: "Côteaux Champenois, FR" },
  { id: 557, name: "Tristan Hyest – LES TERRES ARGILEUSES BdB", producer: "Tristan Hyest", vintage: "2013", region: "Vallée de la Marne, FR" },
  { id: 558, name: "Valentin Leflaive – Avize Grand Cru BdB #16", producer: "Valentin Leflaive", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 559, name: "Vouette & Sorbée – Blanc d\'Argile", producer: "Vouette & Sorbée", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 560, name: "Domaine Gruss – Riesling Grand Cru \'Eichberg\'", producer: "Domaine Gruss", vintage: "2019", region: "Alsace, FR" },
  { id: 561, name: "Henry Burgeois – Sancerre", producer: "Henry Burgeois", vintage: "2017", region: "Loire, FR" },
  { id: 562, name: "Lucien Aviet – Melon à Queue Rouge \'Cuvée des Docteurs\'", producer: "Lucien Aviet", vintage: "2023", region: "Jura, FR", byGlass: true },
  { id: 563, name: "Alexis Leconte – La Terre Mere", producer: "Alexis Leconte", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 564, name: "Anders Frederick Steen – Tout ce qui est beau revient", producer: "Anders Frederick Steen", vintage: "2020", region: "Ardèche, FR" },
  { id: 565, name: "Antoine Lienhardt – Bourgogne Aligoté", producer: "Antoine Lienhardt", vintage: "2022", region: "Burgundija, FR" },
  { id: 566, name: "Chavost – Blanc de Meunier", producer: "Chavost", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 567, name: "Dard et Ribo – Crozes Hermitage Blanc", producer: "Dard et Ribo", vintage: "2018", region: "Rhone, FR" },
  { id: 568, name: "Domaine des Homs – Le Viognier", producer: "Domaine des Homs", vintage: "2022", region: "Languedoc, FR" },
  { id: 569, name: "Domaine Gruss – Gewurztraminer \'Les Roches\'", producer: "Domaine Gruss", vintage: "2019", region: "Alsace, FR" },
  { id: 570, name: "Domaine Rolet – Macvin du Jura", producer: "Domaine Rolet", vintage: "2012", region: "Jura, FR" },
  { id: 571, name: "Famille Moussé – Les Vignes de mon village", producer: "Famille Moussé", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 572, name: "George Laval – Garennes", producer: "George Laval", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 573, name: "Gerard Bertrand – Art de Vivre", producer: "Gerard Bertrand", vintage: "2019", region: "Languedoc, FR" },
  { id: 574, name: "Jean-Baptiste Hardy – Fief de Chaintre", producer: "Jean-Baptiste Hardy", vintage: "2022", region: "Loire, FR" },
  { id: 575, name: "Mickaël Bourg – Saint Peray", producer: "Mickaël Bourg", vintage: "2018", region: "Rhone, FR" },
  { id: 576, name: "Olivier Leflaive – Bourgogne Aligote", producer: "Olivier Leflaive", vintage: "2021", region: "Burgundija, FR" },
  { id: 577, name: "Sylvain Pataille – Bouzeron", producer: "Sylvain Pataille", vintage: "2021", region: "Burgundy, FR" },
  { id: 578, name: "Dard et Ribo – Hermitage", producer: "Dard et Ribo", vintage: "2017", region: "Rhone, FR", byGlass: true },
  { id: 579, name: "Charlot Tanneux – Nicolas Millésime Blanc de Noirs", producer: "Charlot Tanneux", vintage: "2016", region: "Vallée de la Marne, FR" },
  { id: 580, name: "Château Calon Ségur – Marquis de Calon", producer: "Château Calon Ségur", vintage: "2016", region: "Bordeaux, FR" },
  { id: 581, name: "Château De Pez – Saint-Estèphe", producer: "Château De Pez", vintage: "2018", region: "Bordeaux, FR" },
  { id: 582, name: "Château De Pez – Saint-Estèphe", producer: "Château De Pez", vintage: "2011", region: "Bordeaux, FR" },
  { id: 583, name: "Château Gazin – Pomerol", producer: "Château Gazin", vintage: "2011", region: "Bordeaux, FR" },
  { id: 584, name: "Château Margaux – Premier Grand Cru Classé", producer: "Château Margaux", vintage: "2012", region: "Bordeaux, FR" },
  { id: 585, name: "Château Margaux – Premier Grand Cru Classé", producer: "Château Margaux", vintage: "2002", region: "Bordeaux, FR" },
  { id: 586, name: "Château Palmer – Third Grand Cru Classé", producer: "Château Palmer", vintage: "2020", region: "Bordeaux, FR" },
  { id: 587, name: "Château Pontet-Canet – 4eme Cru Clasee", producer: "Château Pontet-Canet", vintage: "2016", region: "Bordeaux, FR" },
  { id: 588, name: "Château Pontet-Canet – 4eme Cru Clasee", producer: "Château Pontet-Canet", vintage: "2011", region: "Bordeaux, FR" },
  { id: 589, name: "Château Pontet-Canet – 4eme Cru Clasee", producer: "Château Pontet-Canet", vintage: "2012", region: "Bordeaux, FR" },
  { id: 590, name: "Château Smith Haut Lafitte – Grand Cru Classé", producer: "Château Smith Haut Lafitte", vintage: "2018", region: "Bordeaux, FR" },
  { id: 591, name: "Domain du Traginer – Banyuls Gran Cru", producer: "Domain du Traginer", vintage: "2008", region: "Roussillon, FR" },
  { id: 592, name: "Domaine de la Grange des Pères – Grange des Pères", producer: "Domaine de la Grange des Pères", vintage: "2020", region: "Languedoc, FR" },
  { id: 593, name: "Domaine de la Grange des Pères – Grange des Pères", producer: "Domaine de la Grange des Pères", vintage: "2012", region: "Languedoc, FR" },
  { id: 594, name: "Domaine Tempier – Migoua", producer: "Domaine Tempier", vintage: "2022", region: "Provansa, FR" },
  { id: 595, name: "Domaine Tempier – Tourtine", producer: "Domaine Tempier", vintage: "2022", region: "Provansa, FR" },
  { id: 596, name: "Domaine Tempier – Rosé", producer: "Domaine Tempier", vintage: "2022", region: "Provansa, FR" },
  { id: 597, name: "Figuière – Confidentielle Rouge", producer: "Figuière", vintage: "2017", region: "Provansa, FR" },
  { id: 598, name: "Jeaunaux-Robin – Rosé", producer: "Jeaunaux-Robin", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 599, name: "Labadens – Châteauneuf-du-Pape", producer: "Labadens", vintage: "2019", region: "Rhone, FR" },
  { id: 600, name: "Lucien Aviet – Trousseau Bruyères \'Cuvée des Géologues\'", producer: "Lucien Aviet", vintage: "2023", region: "Jura, FR" },
  { id: 601, name: "Lucien Aviet – Marne Rouge \'Cuvée des Géologues\'", producer: "Lucien Aviet", vintage: "2023", region: "Jura, FR" },
  { id: 602, name: "Lucien Aviet – Ploussard \'Cuvée des Docteurs\'", producer: "Lucien Aviet", vintage: "2023", region: "Jura, FR" },
  { id: 603, name: "Maria et Vincent Tricot – Petites Fleurs", producer: "Maria et Vincent Tricot", vintage: "2023", region: "Auvergne, FR" },
  { id: 604, name: "Thibaud Pierson – Le Vin des Anciennes", producer: "Thibaud Pierson", vintage: "2022", region: "Jura, FR" },
  { id: 605, name: "Antoine Lienhardt – Emphase", producer: "Antoine Lienhardt", vintage: "2020", region: "Burgundija, FR" },
  { id: 606, name: "Billecart Salmon – Brut Rose", producer: "Billecart Salmon", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 607, name: "Charles Dufour – François FF.13", producer: "Charles Dufour", vintage: "2013", region: "Côte des Bar, FR" },
  { id: 608, name: "Chavost – Saignee", producer: "Chavost", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 609, name: "Chavost – Coteaux champenois", producer: "Chavost", vintage: "2020", region: "Vallée de la Marne, FR" },
  { id: 610, name: "Clandestin – Les Semblables Austral", producer: "Clandestin", vintage: "2022", region: "Côte des Bar, FR" },
  { id: 611, name: "Clandestin – Les Semblables Boreal", producer: "Clandestin", vintage: "2020", region: "Côte des Bar, FR" },
  { id: 612, name: "Clandestin – Les Semblables Boreal", producer: "Clandestin", vintage: "2021", region: "Côte des Bar, FR" },
  { id: 613, name: "David Duband – Hautes Cotes de Nuits", producer: "David Duband", vintage: "2018", region: "Burgundija, FR" },
  { id: 614, name: "David Duband – Charmes-Chambertin Grand Cru", producer: "David Duband", vintage: "2018", region: "Burgundija, FR" },
  { id: 615, name: "Domaine de Chassorney – Volnay", producer: "Domaine de Chassorney", vintage: "2019", region: "Burgundija, FR" },
  { id: 616, name: "Domaine Duroche – Gevrey-Chambertin Champ", producer: "Domaine Duroche", vintage: "2022", region: "Burgundija, FR" },
  { id: 617, name: "Domaine Duroche – Gevrey-Chambertin Les Jeunes Rois", producer: "Domaine Duroche", vintage: "2022", region: "Burgundija, FR" },
  { id: 618, name: "Domaine Jean Marc Millot – Nuits Saint Georges", producer: "Domaine Jean Marc Millot", vintage: "2023", region: "Burgundija, FR" },
  { id: 619, name: "Domaine Jean Marc Millot – Vosne Romanée 1er cru \'Les Suchots\'", producer: "Domaine Jean Marc Millot", vintage: "2023", region: "Burgundija, FR" },
  { id: 620, name: "Domaine Mure – Volnay", producer: "Domaine Mure", vintage: "1985", region: "Burgundija, FR" },
  { id: 621, name: "Domaine Pierre V. Girardin – Pommard 1er cru Les Rugiens bas", producer: "Domaine Pierre V. Girardin", vintage: "2022", region: "Burgundija, FR" },
  { id: 622, name: "Domaine Pierre V. Girardin – Vosne Romanée 1er cru Les Suchots", producer: "Domaine Pierre V. Girardin", vintage: "2021", region: "Burgundija, FR" },
  { id: 623, name: "Domaine Y. Clerget – Volnay 1er cru Santenots", producer: "Domaine Y. Clerget", vintage: "2022", region: "Burgundija, FR" },
  { id: 624, name: "Drappier – Sans Ajout de Souffre BdN", producer: "Drappier", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 625, name: "Egly-Ouriet – Blanc de Noirs Vieilles Vignes Grand Cru", producer: "Egly-Ouriet", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 626, name: "Famille Moussé – Eugène Rosé", producer: "Famille Moussé", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 627, name: "Fiona Leroy – Maranges", producer: "Fiona Leroy", vintage: "2022", region: "Burgundija, FR" },
  { id: 628, name: "Fiona Leroy – Hautes Côtes de Beaune \'Les Champs Rigets\'", producer: "Fiona Leroy", vintage: "2022", region: "Burgundija, FR" },
  { id: 629, name: "Fleury – Blanc de Noirs Brut", producer: "Fleury", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 630, name: "Fleury – CÔTEAUX CHAMPENOIS", producer: "Fleury", vintage: "2019", region: "Côteaux Champenois, FR" },
  { id: 631, name: "Francois Nicolay – Savigny-le-Beaune", producer: "Francois Nicolay", vintage: "2018", region: "Burgundija, FR" },
  { id: 632, name: "Jacquesson – Terres Rouges BDN", producer: "Jacquesson", vintage: "2012", region: "Vallée de la Marne, FR" },
  { id: 633, name: "Marc Pinto & Louis Mathieu – Les Nargilets", producer: "Marc Pinto & Louis Mathieu", vintage: "2009", region: "Burgundy, FR" },
  { id: 634, name: "Maria et Vincent Tricot – 3bonhommes", producer: "Maria et Vincent Tricot", vintage: "2023", region: "Auvergne, FR" },
  { id: 635, name: "Marthe Henry – Pommard \'Les Vignots\'", producer: "Marthe Henry", vintage: "2022", region: "Burgundija, FR" },
  { id: 636, name: "Marthe Leroy – Maranges", producer: "Marthe Leroy", vintage: "2021", region: "Burgundija, FR" },
  { id: 637, name: "Mouzon Leroux – L\'Incandescent", producer: "Mouzon Leroux", vintage: "2019", region: "Montagne de Reims, FR" },
  { id: 638, name: "Nicolas Potel – Beaune 1er Cru", producer: "Nicolas Potel", vintage: "2002", region: "Burgundija, FR" },
  { id: 639, name: "Nicolas Rossignol – Volnay 1er Cru \'Santenots\'", producer: "Nicolas Rossignol", vintage: "2017", region: "Burgundija, FR" },
  { id: 640, name: "Nicolas Rossignol – Pommard 1er cru \'Epenots\'", producer: "Nicolas Rossignol", vintage: "2017", region: "Burgundija, FR" },
  { id: 641, name: "Olivier Leflaive – 1er Cru Clos des Angeles", producer: "Olivier Leflaive", vintage: "2017", region: "Burgundija, FR" },
  { id: 642, name: "Palmer & Co – Rose Solera", producer: "Palmer & Co", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 643, name: "Pertois-Moriset – Barbonne", producer: "Pertois-Moriset", vintage: "2018", region: "Côte des Blancs, FR" },
  { id: 644, name: "Romain et Pascal Henin – MPQR", producer: "Romain et Pascal Henin", vintage: "2019", region: "Côteaux Champenois, FR" },
  { id: 645, name: "Sacy Soeur & Frère – CÔTEAUX CHAMPENOIS BdN", producer: "Sacy Soeur & Frère", vintage: "2021", region: "Côteaux Champenois, FR" },
  { id: 646, name: "Salima et Alain Cordeuil – Altitude 320", producer: "Salima et Alain Cordeuil", vintage: "2019", region: "Côte des Bar, FR" },
  { id: 647, name: "Salima et Alain Cordeuil – Saignée", producer: "Salima et Alain Cordeuil", vintage: "2020", region: "Côte des Bar, FR" },
  { id: 648, name: "Stephane Cyran – Acratus", producer: "Stephane Cyran", vintage: "2022", region: "Lorraine, FR" },
  { id: 649, name: "Vincent Girardin – Volnay Vielles Vignes", producer: "Vincent Girardin", vintage: "2018", region: "Burgundija, FR" },
  { id: 650, name: "Vincent Girardin – Gevrey-Chambertin Vieilles Vignes", producer: "Vincent Girardin", vintage: "2018", region: "Burgundija, FR" },
  { id: 651, name: "Vouette & Sorbée – Fidèle", producer: "Vouette & Sorbée", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 652, name: "Château Rayas – Château des Tours", producer: "Château Rayas", vintage: "2013", region: "Côtes du Rhône, FR" },
  { id: 653, name: "Chateau Thivin – Cote de Brouilly Les 7 Vignes", producer: "Chateau Thivin", vintage: "2019", region: "Beaujolais, FR" },
  { id: 654, name: "Dard et Ribo – Crozes Hermitage Le Printemps", producer: "Dard et Ribo", vintage: "2018", region: "Rhone, FR" },
  { id: 655, name: "Domaine de Montbourgeau – Clos des Fraisiers", producer: "Domaine de Montbourgeau", vintage: "2023", region: "Jura, FR" },
  { id: 656, name: "Domaine des Bodins – Poulsard", producer: "Domaine des Bodins", vintage: "2018", region: "Jura, FR" },
  { id: 657, name: "Egly-Ouriet – Les Vignes de Vrigny Premier Cru", producer: "Egly-Ouriet", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 658, name: "Jeaunaux-Robin – Instinct Meunier", producer: "Jeaunaux-Robin", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 659, name: "Jules Metras – Chiroubles La Montagne", producer: "Jules Metras", vintage: "2019", region: "Beaujolais, FR" },
  { id: 660, name: "Jules Metras – Bijou", producer: "Jules Metras", vintage: "2019", region: "Beaujolais, FR" },
  { id: 661, name: "Jules Metras – Chiroubles", producer: "Jules Metras", vintage: "2019", region: "Beaujolais, FR" },
  { id: 662, name: "Maï Roblin Bazin – Juliénas \'Les Soubletons\'", producer: "Maï Roblin Bazin", vintage: "2023", region: "Jura, FR" },
  { id: 663, name: "Mickaël Bourg – Cornas", producer: "Mickaël Bourg", vintage: "2018", region: "Rhone, FR" },
  { id: 664, name: "Timothée Stroebel – Heraclite", producer: "Timothée Stroebel", vintage: "2019", region: "Montagne de Reims, FR" },
  { id: 665, name: "Zeroïne – Gacha", producer: "Zeroïne", vintage: "2019", region: "Jura, FR" },
  { id: 666, name: "Zeroïne – Gaga", producer: "Zeroïne", vintage: "2018", region: "Jura, FR" },
  { id: 667, name: "Egly-Ouriet – Les Vignes de Bisseuil Premier Cru", producer: "Egly-Ouriet", vintage: "NV", region: "Champagne, FR", byGlass: true },
  { id: 668, name: "Krug – Grande Cuvée 173ème edition", producer: "Krug", vintage: "NV", region: "Montagne de Reims, FR", byGlass: true },
  { id: 669, name: "Adrien Renoir – \'Le Terroir\' Verzy Grand Cru", producer: "Adrien Renoir", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 670, name: "Agrapart & Fils – 7 Crus Brut", producer: "Agrapart & Fils", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 671, name: "Alexis Leconte – Totem", producer: "Alexis Leconte", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 672, name: "Anders Frederick Steen – C\'est dans les yeux qu\'on le voit", producer: "Anders Frederick Steen", vintage: "2019", region: "Ardèche, FR" },
  { id: 673, name: "Aurore Casanova – Cuvée Aure", producer: "Aurore Casanova", vintage: "2021", region: "Côte des Bar, FR" },
  { id: 674, name: "Billecart Salmon – Sous Bois", producer: "Billecart Salmon", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 675, name: "Billecart Salmon – Le Sous Bois", producer: "Billecart Salmon", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 676, name: "Bonnaire – Love Story", producer: "Bonnaire", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 677, name: "Charles Dufour – Bulles de Comptoir #11", producer: "Charles Dufour", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 678, name: "Charles Dufour – The Ballad of the Villages", producer: "Charles Dufour", vintage: "2004", region: "Côte des Bar, FR" },
  { id: 679, name: "Chavost – Blanc d\'Assemblage Brut Nature", producer: "Chavost", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 680, name: "Chavost – Eureka", producer: "Chavost", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 681, name: "Chavost – Blanc d\'Assemblage Wimbledon", producer: "Chavost", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 682, name: "Dom Pérignon – Plentitude P2", producer: "Dom Pérignon", vintage: "2004", region: "Vallée de la Marne, FR" },
  { id: 683, name: "Dom Pérignon – Rosé", producer: "Dom Pérignon", vintage: "2009", region: "Vallée de la Marne, FR" },
  { id: 684, name: "Drappier – Clarevallis", producer: "Drappier", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 685, name: "Drappier – Grande Sendrée", producer: "Drappier", vintage: "2010", region: "Côte des Bar, FR" },
  { id: 686, name: "Egly-Ouriet – Les Premices", producer: "Egly-Ouriet", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 687, name: "Egly-Ouriet – Tradition Grand Cru", producer: "Egly-Ouriet", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 688, name: "Egly-Ouriet – Rosé Grand Cru", producer: "Egly-Ouriet", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 689, name: "Egly-Ouriet – Vieillissement Prolonge Grand Cru", producer: "Egly-Ouriet", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 690, name: "Egly-Ouriet – Millesime Grand Cru", producer: "Egly-Ouriet", vintage: "2016", region: "Montagne de Reims, FR" },
  { id: 691, name: "Emilien Allouchery – La Comédie", producer: "Emilien Allouchery", vintage: "2019", region: "Montagne de Reims, FR" },
  { id: 692, name: "Godmé-Guillaume – Village V.V.V.", producer: "Godmé-Guillaume", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 693, name: "Gosset – Grande Réserve", producer: "Gosset", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 694, name: "Gosset – Millesime", producer: "Gosset", vintage: "2015", region: "Vallée de la Marne, FR" },
  { id: 695, name: "Jacquesson – Cuvée n° 743 Dégorgement Tardif", producer: "Jacquesson", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 696, name: "Jacquesson – Cuvée n° 744", producer: "Jacquesson", vintage: "2016", region: "Vallée de la Marne, FR" },
  { id: 697, name: "Jeaunaux-Robin – Eclats de Meulière", producer: "Jeaunaux-Robin", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 698, name: "Jeaunaux-Robin – Les Grands Nots", producer: "Jeaunaux-Robin", vintage: "2011", region: "Côte des Blancs, FR" },
  { id: 699, name: "Jeaunaux-Robin – Fil de Brume", producer: "Jeaunaux-Robin", vintage: "NV", region: "Côte des Blancs, FR" },
  { id: 700, name: "Krug – Grande Cuvée 172ème edition", producer: "Krug", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 701, name: "Krug – Grande Cuvée 171ème edition", producer: "Krug", vintage: "NV", region: "Montagne de Reims, FR" },
  { id: 702, name: "Krug – Vintage 2002", producer: "Krug", vintage: "2002", region: "Montagne de Reims, FR" },
  { id: 703, name: "Krug – Vintage 2011", producer: "Krug", vintage: "2011", region: "Montagne de Reims, FR" },
  { id: 704, name: "Lamiable – Héliades", producer: "Lamiable", vintage: "2014", region: "Vallée de la Marne, FR" },
  { id: 705, name: "Langlois-Chateau – Crémant de Loire Blanc Brut", producer: "Langlois-Chateau", vintage: "NV", region: "Loire, FR" },
  { id: 706, name: "Louise Brisson – Extra Brut Millésime", producer: "Louise Brisson", vintage: "2015", region: "Côte des Bar, FR" },
  { id: 707, name: "Michel Henriet – Grand Cru 2013", producer: "Michel Henriet", vintage: "2013", region: "Vallée de la Marne, FR" },
  { id: 708, name: "Philipponnat – Royale Reserve Non Dosage", producer: "Philipponnat", vintage: "2018", region: "Vallée de la Marne, FR" },
  { id: 709, name: "Philipponnat – Royale Brut Reserve", producer: "Philipponnat", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 710, name: "Romain et Pascal Henin – Galip\'ette", producer: "Romain et Pascal Henin", vintage: "NV", region: "Vallée de la Marne, FR" },
  { id: 711, name: "Ruppert Leroy – Puzzle", producer: "Ruppert Leroy", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 712, name: "Salima et Alain Cordeuil – Origines", producer: "Salima et Alain Cordeuil", vintage: "2018", region: "Côte des Bar, FR" },
  { id: 713, name: "Serge & Olivier Horiot – Métisse", producer: "Serge & Olivier Horiot", vintage: "NV", region: "Côte des Bar, FR" },
  { id: 714, name: "Serge & Olivier Horiot – 5 Sens", producer: "Serge & Olivier Horiot", vintage: "2017", region: "Côte des Bar, FR" },
  { id: 715, name: "Veuve Clicquot – La Grande Dame", producer: "Veuve Clicquot", vintage: "2015", region: "Montagne de Reims, FR" },
  { id: 716, name: "E. Bordelet – Sidre Brut Tendre", producer: "E. Bordelet", vintage: "NV", region: "Normandy, FR" },
];

// ── Initial extra dishes ──────────────────────────────────────────────────────
const initDishes = [
  { id: 1, name: "Beetroot",  pairings: ["—", "Wine", "Non-Alc"] },
  { id: 2, name: "Cheese",    pairings: ["—", "Wine", "Non-Alc"] },
];

// ── Cocktails ─────────────────────────────────────────────────────────────────
const initCocktails = [
  { id: 1,  name: "Freezer Dry Martini",        notes: "Vodka, Gin, Dry Vermouth" },
  { id: 2,  name: "Espresso Martini",           notes: "House Coffee Liqueur, Cognac" },
  { id: 3,  name: "Fruity & Creamy",            notes: "Coffee, Apricot, Fig Leaf Cream" },
  { id: 4,  name: "Cozy & Boozy",               notes: "Whiskey, Winter Spices, Tonka" },
  { id: 5,  name: "Negroni",                    notes: "Campari, Gin" },
  { id: 6,  name: "Old Fashion",                notes: "Whiskey, Bitters" },
  { id: 7,  name: "Fluffy & Earthy",            notes: "Carrot, Campari, Aquavit" },
  { id: 8,  name: "Bitter & Fresh",             notes: "Beer, Spruces, Italicus" },
];

// ── Spirits ───────────────────────────────────────────────────────────────────
const initSpirits = [
  // Whisky
  { id: 1,  name: "Nectar d'Or",               notes: "Glenmorangie · Highland" },
  { id: 2,  name: "15yo Single Malt",           notes: "Glenfarclas · Speyside" },
  { id: 3,  name: "Viking Honour 12yo",         notes: "Highland Park · Islands" },
  { id: 4,  name: "Lagavulin 16yo",             notes: "Lagavulin · Islay" },
  { id: 5,  name: "Distiller's Select",        notes: "Woodford Reserve · Bourbon" },
  { id: 6,  name: "Rare Breed Kentucky Bourbon",notes: "Wild Turkey" },
  { id: 7,  name: "12yo Straight Rye",          notes: "Whistle Pig" },
  { id: 8,  name: "Yamazaki 12yo Single Malt",  notes: "Suntory · Japan" },
  { id: 9,  name: "21yo Rare Single Malt",      notes: "Bushmills · N. Ireland" },
  { id: 10, name: "Extremely Rare 18yo",        notes: "Glenmorangie · Highland" },
  // Cognac / Brandy
  { id: 11, name: "Calvados XO Pays d'Auge",   notes: "Christian Drouin" },
  { id: 12, name: "Armagnac Delord 1985",       notes: "Vieil Armagnac Delord" },
  { id: 13, name: "Cognac Lot No76 XO",         notes: "Tesseron" },
  { id: 14, name: "Hennessy XO",               notes: "Cognac · France" },
  // Rum
  { id: 15, name: "Ron Santiago de Cuba 20yr",  notes: "Corporación Cuba Ron" },
  { id: 16, name: "Eminente 10 años",           notes: "Ron Eminente · Cuba" },
  { id: 17, name: "Rare Blend 12yo",            notes: "Appleton Estate · Jamaica" },
  // Agave
  { id: 18, name: "Tequila Blanco",             notes: "Don Julio" },
  { id: 19, name: "Tequila Añejo",              notes: "Patron" },
  { id: 20, name: "Mezcal X Bruxo",             notes: "Bruxo · Mexico" },
  // Gin
  { id: 21, name: "Old Tom Gin",                notes: "Broken Bones · Slovenia" },
  { id: 22, name: "London Dry Gin",             notes: "Broken Bones · Slovenia" },
  // Vodka
  { id: 23, name: "VX Vodka Exceptionnelle",    notes: "Grey Goose · France" },
  // Other
  { id: 24, name: "Zigarrenbrand Williams",     notes: "Williams · Austria" },
  { id: 25, name: "Dekada",                     notes: "Podrum Lukić · Serbia" },
  { id: 26, name: "Viljamovka Small Batch",     notes: "Berke · Slovenia" },
  { id: 27, name: "Grappa Gravner Ribolla",     notes: "Capovila · Slovenia" },
  { id: 28, name: "Plum Small Batch",           notes: "Berke · Slovenia" },
  { id: 29, name: "Jurka Small Batch",          notes: "Berke · Slovenia" },
  // Liqueur / Grenčice
  { id: 30, name: "Amaro Montenegro",           notes: "Montenegro · Italy" },
  { id: 31, name: "Averna Amaro",               notes: "Averna · Italy" },
  { id: 32, name: "Aperitivo Classico (non-alc)",notes: "Vera Spirits · Slovenia" },
  { id: 33, name: "Pelinkovec Antique",         notes: "Badel 1862 · Croatia" },
  { id: 34, name: "Campari",                    notes: "Italy" },
  { id: 35, name: "Fernet-Branca",              notes: "Fratelli Branca · Italy" },
  { id: 36, name: "Milka Liqueur",              notes: "MILKA · Slovenia" },
];

// ── Beers ─────────────────────────────────────────────────────────────────────
const initBeers = [];

// ── Water ─────────────────────────────────────────────────────────────────────
const WATER_OPTS = ["—", "XC", "XW", "OC", "OW"];
const waterStyle = v => {
  if (v === "XC" || v === "XW") return { color: "#1a1a1a", bg: "#f0f0f0" };
  if (v === "OC" || v === "OW") return { color: "#1a1a1a", bg: "#e8e8e8" };
  return { color: "#555", bg: "transparent" };
};

// ── Pairings ──────────────────────────────────────────────────────────────────
const PAIRINGS = ["Wine", "Non-Alc", "Premium", "Our Story"];
const pairingStyle = {
  "Non-Alc":  { color: "#1f5f73", border: "#7fc6db88", bg: "#7fc6db12" },
  "Wine":      { color: "#8a6030", border: "#c8a06088", bg: "#c8a06008" },
  "Premium":   { color: "#5a5a8a", border: "#8888bb88", bg: "#8888bb08" },
  "Our Story": { color: "#3a7a5a", border: "#5aaa7a88", bg: "#5aaa7a08" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fuzzy = (q, wineList, byGlass = null) => {
  if (!q) return [];
  const lq = q.toLowerCase();
  return wineList.filter(w => {
    const hit = w.name.toLowerCase().includes(lq) || w.producer.toLowerCase().includes(lq) || w.vintage.includes(lq);
    return hit && (byGlass === null || w.byGlass === byGlass);
  }).slice(0, 6);
};

const fuzzyDrink = (q, list) => {
  if (!q) return [];
  const lq = q.toLowerCase();
  return list.filter(d =>
    d.name.toLowerCase().includes(lq) || (d.notes || "").toLowerCase().includes(lq)
  ).slice(0, 6);
};

const makeSeats = (n, ex = []) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    water:     ex[i]?.water     ?? "—",
    glasses:   ex[i]?.glasses   ?? [],
    cocktails: ex[i]?.cocktails ?? [],
    spirits:   ex[i]?.spirits   ?? [],
    beers:     ex[i]?.beers     ?? [],
    pairing:   ex[i]?.pairing   ?? "",
    extras:    ex[i]?.extras    ?? {},
  }));

const fmt = d => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

// ── Blank table factory ───────────────────────────────────────────────────────
const blankTable = id => ({
  id, active: false, guests: 2, resName: "", resTime: "", guestType: "", room: "",
  arrivedAt: null, menuType: "", bottleWine: null,
  restrictions: [], birthday: false, notes: "", seats: makeSeats(2),
});

const initTables = Array.from({ length: 10 }, (_, i) => blankTable(i + 1));

// ── sanitizeTable: fill any missing fields so stale Supabase data never breaks UI ──
const sanitizeTable = t => ({
  ...blankTable(t.id ?? 0),
  ...t,
  seats: makeSeats(
    t.guests ?? 2,
    Array.isArray(t.seats) ? t.seats : []
  ),
  restrictions: Array.isArray(t.restrictions) ? t.restrictions : [],
});

// ── Shared styles ─────────────────────────────────────────────────────────────
const baseInp = {
  fontFamily: FONT, fontSize: MOBILE_SAFE_INPUT_SIZE, // 16px prevents iOS auto-zoom
  padding: "10px 12px", border: "1px solid #e8e8e8",
  borderRadius: 2, outline: "none",
  color: "#1a1a1a", background: "#fff",
  boxSizing: "border-box", width: "100%", minWidth: 0,
  WebkitAppearance: "none", // removes iOS styling
};
const fieldLabel = {
  fontFamily: FONT, fontSize: 9,
  letterSpacing: 3, color: "#444",
  textTransform: "uppercase", marginBottom: 8,
};
const topStatChip = {
  fontFamily: FONT,
  fontSize: 10,
  color: "#1a1a1a",
  letterSpacing: 1,
  padding: "6px 10px",
  border: "1px solid #e8e8e8",
  borderRadius: 999,
  background: "#fff",
  whiteSpace: "nowrap",
};
const statusPill = (isLive, label) => ({
  fontFamily: FONT,
  fontSize: 9,
  letterSpacing: 2,
  padding: "6px 10px",
  border: `1px solid ${isLive ? "#8fc39f" : "#d8d8d8"}`,
  borderRadius: 999,
  background: isLive ? "#eef8f1" : "#f6f6f6",
  color: isLive ? "#2f7a45" : "#555",
  fontWeight: 600,
  whiteSpace: "nowrap",
});

const STORAGE_KEY = "milka-service-board-v7";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const defaultBoardState = () => ({
  tables: initTables,
  dishes: initDishes,
  wines: initWines,
  cocktails: initCocktails,
  spirits: initSpirits,
  beers: initBeers,
});

const readLocalBoardState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const writeLocalBoardState = state => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const circBtnSm = {
  width: 36, height: 36, borderRadius: "50%",
  border: "1px solid #e8e8e8", background: "#fff",
  color: "#444", fontSize: 18, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: FONT, lineHeight: 1, touchAction: "manipulation",
};

function useIsMobile(bp = 700) {
  const getValue = () => (typeof window !== "undefined" ? window.innerWidth < bp : false);
  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const onResize = () => setIsMobile(getValue());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);

  return isMobile;
}

// ── Water Picker ──────────────────────────────────────────────────────────────
function WaterPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, []);
  const ws = waterStyle(value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        fontFamily: FONT, fontSize: 12, fontWeight: 500,
        padding: "6px 10px", border: "1px solid #e8e8e8",
        borderRadius: 2, cursor: "pointer", width: "100%",
        background: ws.bg, color: ws.color, letterSpacing: 1,
      }}>{value}</button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
          zIndex: 200, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", minWidth: 70,
        }}>
          {WATER_OPTS.map(opt => (
            <div key={opt} onMouseDown={() => { onChange(opt); setOpen(false); }} style={{
              padding: "8px 14px", cursor: "pointer",
              fontFamily: FONT, fontSize: 12, letterSpacing: 1,
              color: value === opt ? "#1a1a1a" : "#999",
              background: value === opt ? "#f8f8f8" : "#fff",
              fontWeight: value === opt ? 500 : 400,
              borderBottom: "1px solid #f5f5f5",
            }}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wine Search ───────────────────────────────────────────────────────────────
function WineSearch({ wineObj, wines = [], onChange, placeholder, byGlass = null, compact = false }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, []);
  const fs = compact ? 11 : 12;
  const inputFs = MOBILE_SAFE_INPUT_SIZE;
  const py = compact ? 5 : 7;
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {wineObj ? (
        <div style={{
          display: "flex", alignItems: "center",
          border: "1px solid #d8d8d8", borderRadius: 2,
          padding: `${py}px 28px ${py}px 10px`,
          background: "#fafafa", position: "relative",
          fontSize: fs, fontFamily: FONT, color: "#4a4a4a",
        }}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {wineObj.name} · {wineObj.producer} · {wineObj.vintage}
          </span>
          <button onClick={e => { e.stopPropagation(); onChange(null); }} style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>
      ) : (
        <input value={q} onChange={e => {
          setQ(e.target.value);
          const r = fuzzy(e.target.value, wines, byGlass);
          setResults(r); setOpen(r.length > 0);
          if (!e.target.value) onChange(null);
        }} onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder || "search…"}
          style={{ ...baseInp, fontSize: inputFs, padding: `${py}px 10px`, letterSpacing: 0.3 }} />
      )}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
          zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {results.map(w => (
            <div key={w.id} onMouseDown={() => { setQ(""); setOpen(false); onChange(w); }} style={{
              padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f5f5f5",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <span style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a" }}>{w.name}</span>
                <span style={{ fontFamily: FONT, fontSize: 11, color: "#444" }}> · {w.producer} · {w.vintage}</span>
              </div>
              {w.byGlass && <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, color: "#444", border: "1px solid #e8e8e8", borderRadius: 2, padding: "2px 5px" }}>glass</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drink Search (cocktails / spirits) ────────────────────────────────────────
function DrinkSearch({ drinkObj, list = [], onChange, placeholder, accentColor = "#7a507a" }) {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]     = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {drinkObj ? (
        <div style={{
          display: "flex", alignItems: "center",
          border: `1px solid ${accentColor}44`, borderRadius: 2,
          padding: "5px 28px 5px 10px", background: `${accentColor}08`,
          position: "relative", fontSize: 11, fontFamily: FONT, color: "#4a4a4a",
        }}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {drinkObj.name}{drinkObj.notes ? ` · ${drinkObj.notes}` : ""}
          </span>
          <button onClick={e => { e.stopPropagation(); onChange(null); }} style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>
      ) : (
        <input value={q} onChange={e => {
          setQ(e.target.value);
          const r = fuzzyDrink(e.target.value, list);
          setResults(r); setOpen(r.length > 0);
          if (!e.target.value) onChange(null);
        }} onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder || "search…"}
          style={{ ...baseInp, fontSize: MOBILE_SAFE_INPUT_SIZE, padding: "5px 10px", letterSpacing: 0.3 }} />
      )}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
          zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {results.map(d => (
            <div key={d.id} onMouseDown={() => { setQ(""); setOpen(false); onChange(d); }} style={{
              padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid #f5f5f5",
              fontFamily: FONT, fontSize: 12, color: "#1a1a1a",
            }}>
              {d.name}{d.notes ? <span style={{ color: "#444" }}> · {d.notes}</span> : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Swap Picker ───────────────────────────────────────────────────────────────
function SwapPicker({ seatId, totalSeats, onSwap }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, []);
  const others = Array.from({ length: totalSeats }, (_, i) => i + 1).filter(n => n !== seatId);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Swap position" style={{
        width: 28, height: 28, borderRadius: 2,
        border: "1px solid #e8e8e8", background: open ? "#f5f5f5" : "#fff",
        color: "#555", cursor: "pointer", fontSize: 13,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>⇅</button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", right: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
          zIndex: 300, overflow: "hidden", minWidth: 80,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#555", padding: "7px 12px 4px", textTransform: "uppercase" }}>swap with</div>
          {others.map(n => (
            <div key={n} onMouseDown={() => { onSwap(n); setOpen(false); }} style={{
              padding: "8px 14px", cursor: "pointer",
              fontFamily: FONT, fontSize: 12, color: "#1a1a1a",
              borderTop: "1px solid #f5f5f5",
            }}>P{n}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Beverage type styles (shared) ─────────────────────────────────────────────
const BEV_TYPES = {
  wine:     { label: "Glass",    color: "#7a5020", bg: "#fdf4e8", border: "#c8a060", dot: "#c8a060" },
  cocktail: { label: "Cocktail", color: "#5a3878", bg: "#f5eeff", border: "#b898d8", dot: "#b898d8" },
  spirit:   { label: "Spirit",   color: "#7a5020", bg: "#fff3e0", border: "#d4a870", dot: "#d4a870" },
  beer:     { label: "Beer",     color: "#3a6a2a", bg: "#edf8e8", border: "#88bb70", dot: "#88bb70" },
};

// ── BeverageSearch — unified single-search across all drink types ──────────────
function BeverageSearch({ wines, cocktails, spirits, beers, onAdd }) {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]     = useState(false);
  const ref = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, []);

  const search = val => {
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    const lq = val.toLowerCase();
    const r = [];
    wines.filter(w => w.byGlass).forEach(w => {
      if (w.name.toLowerCase().includes(lq) || w.producer?.toLowerCase().includes(lq) || w.vintage?.includes(lq))
        r.push({ type: "wine",     item: w, label: w.name, sub: `${w.producer} · ${w.vintage}` });
    });
    cocktails.forEach(c => {
      if (c.name.toLowerCase().includes(lq) || (c.notes||"").toLowerCase().includes(lq))
        r.push({ type: "cocktail", item: c, label: c.name, sub: c.notes || "" });
    });
    spirits.forEach(s => {
      if (s.name.toLowerCase().includes(lq) || (s.notes||"").toLowerCase().includes(lq))
        r.push({ type: "spirit",   item: s, label: s.name, sub: s.notes || "" });
    });
    beers.forEach(b => {
      if (b.name.toLowerCase().includes(lq) || (b.notes||"").toLowerCase().includes(lq))
        r.push({ type: "beer",     item: b, label: b.name, sub: b.notes || "" });
    });
    setResults(r.slice(0, 10));
    setOpen(r.length > 0);
  };

  const handleAdd = entry => {
    onAdd(entry);
    setQ("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={q}
        onChange={e => { setQ(e.target.value); search(e.target.value); }}
        onFocus={() => results.length && setOpen(true)}
        placeholder="search beverages…"
        autoComplete="off"
        style={{ ...baseInp, fontSize: MOBILE_SAFE_INPUT_SIZE, padding: "9px 12px", letterSpacing: 0.3 }}
      />
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4,
          zIndex: 300, boxShadow: "0 6px 24px rgba(0,0,0,0.10)", overflow: "hidden",
        }}>
          {results.map((r, i) => {
            const ts = BEV_TYPES[r.type];
            return (
              <div key={i} onMouseDown={() => handleAdd(r)} style={{
                padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8f8f8",
                display: "flex", alignItems: "center", gap: 10,
                background: "#fff",
              }}>
                <span style={{
                  fontFamily: FONT, fontSize: 8, letterSpacing: 1, fontWeight: 600,
                  padding: "2px 6px", borderRadius: 2,
                  color: ts.color, background: ts.bg, border: `1px solid ${ts.border}`,
                  flexShrink: 0, textTransform: "uppercase",
                }}>{ts.label}</span>
                <span style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a", flex: 1 }}>{r.label}</span>
                {r.sub && <span style={{ fontFamily: FONT, fontSize: 11, color: "#999" }}>{r.sub}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Drink List Editor (used inside AdminPanel tabs) ───────────────────────────
function DrinkListEditor({ list, setList, newItem, setNewItem, nextId, label }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: 8, marginBottom: 8 }}>
        {["Name", "Notes / Label", ""].map((h, i) => (
          <div key={i} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>{h}</div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #f0f0f0", marginBottom: 12 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>
        {list.map(item => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: 8, alignItems: "center" }}>
            <input value={item.name} onChange={e => setList(l => l.map(x => x.id === item.id ? { ...x, name: e.target.value } : x))}
              style={{ ...baseInp, padding: "5px 8px" }} placeholder="Name" />
            <input value={item.notes} onChange={e => setList(l => l.map(x => x.id === item.id ? { ...x, notes: e.target.value } : x))}
              style={{ ...baseInp, padding: "5px 8px" }} placeholder="e.g. classic / on the rocks" />
            <button onClick={() => setList(l => l.filter(x => x.id !== item.id))} style={{
              background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
            }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
        <div style={fieldLabel}>Add {label}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <input value={newItem.name} onChange={e => setNewItem(x => ({ ...x, name: e.target.value }))}
            placeholder="Name" style={{ ...baseInp, padding: "5px 8px" }} />
          <input value={newItem.notes} onChange={e => setNewItem(x => ({ ...x, notes: e.target.value }))}
            placeholder="Notes (optional)" style={{ ...baseInp, padding: "5px 8px" }}
            onKeyDown={e => { if (e.key === "Enter" && newItem.name.trim()) { setList(l => [...l, { ...newItem, id: nextId.current++ }]); setNewItem({ name: "", notes: "" }); }}} />
        </div>
        <button onClick={() => { if (!newItem.name.trim()) return; setList(l => [...l, { ...newItem, id: nextId.current++ }]); setNewItem({ name: "", notes: "" }); }} style={{
          fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "8px 20px",
          border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff",
        }}>+ ADD {label.toUpperCase()}</button>
      </div>
    </>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ dishes, wines, cocktails, spirits, beers, onUpdateDishes, onUpdateWines, onUpdateCocktails, onUpdateSpirits, onUpdateBeers, onClose }) {
  const [tab, setTab] = useState("wines");
  const isMobile = useIsMobile(700);

  // ── Dishes ──
  const [localDishes, setLocalDishes] = useState(dishes.map(d => ({ ...d, pairings: [...d.pairings] })));
  const [newDishName, setNewDishName] = useState("");
  const nextDishId = useRef(Math.max(...dishes.map(d => d.id), 0) + 1);
  const addDish = () => { if (!newDishName.trim()) return; setLocalDishes(l => [...l, { id: nextDishId.current++, name: newDishName.trim(), pairings: ["—", "Wine", "Non-Alc"] }]); setNewDishName(""); };
  const removeDish    = id         => setLocalDishes(l => l.filter(d => d.id !== id));
  const updDishName   = (id, v)    => setLocalDishes(l => l.map(d => d.id === id ? { ...d, name: v } : d));
  const addPairing    = id         => setLocalDishes(l => l.map(d => d.id === id ? { ...d, pairings: [...d.pairings, ""] } : d));
  const updPairing    = (id, i, v) => setLocalDishes(l => l.map(d => d.id === id ? { ...d, pairings: d.pairings.map((p, idx) => idx === i ? v : p) } : d));
  const removePairing = (id, i)    => setLocalDishes(l => l.map(d => d.id === id ? { ...d, pairings: d.pairings.filter((_, idx) => idx !== i) } : d));

  // ── Wines ──
  const [localWines, setLocalWines] = useState(wines.map(w => ({ ...w })));
  const [newWine, setNewWine] = useState({ name: "", producer: "", vintage: "", byGlass: false });
  const nextWineId = useRef(Math.max(...wines.map(w => w.id), 0) + 1);
  const addWine    = () => { if (!newWine.name.trim()) return; setLocalWines(l => [...l, { ...newWine, id: nextWineId.current++ }]); setNewWine({ name: "", producer: "", vintage: "", byGlass: false }); };
  const removeWine = id       => setLocalWines(l => l.filter(w => w.id !== id));
  const updWine    = (id,f,v) => setLocalWines(l => l.map(w => w.id === id ? { ...w, [f]: v } : w));

  // ── Cocktails ──
  const [localCocktails, setLocalCocktails] = useState(cocktails.map(c => ({ ...c })));
  const [newCocktail, setNewCocktail] = useState({ name: "", notes: "" });
  const nextCocktailId = useRef(Math.max(...cocktails.map(c => c.id), 0) + 1);
  const addCocktail    = () => { if (!newCocktail.name.trim()) return; setLocalCocktails(l => [...l, { ...newCocktail, id: nextCocktailId.current++ }]); setNewCocktail({ name: "", notes: "" }); };
  const removeCocktail = id      => setLocalCocktails(l => l.filter(c => c.id !== id));
  const updCocktail    = (id,f,v) => setLocalCocktails(l => l.map(c => c.id === id ? { ...c, [f]: v } : c));

  // ── Spirits ──
  const [localSpirits, setLocalSpirits] = useState(spirits.map(s => ({ ...s })));
  const [newSpirit, setNewSpirit] = useState({ name: "", notes: "" });
  const nextSpiritId = useRef(Math.max(...spirits.map(s => s.id), 0) + 1);
  const addSpirit    = () => { if (!newSpirit.name.trim()) return; setLocalSpirits(l => [...l, { ...newSpirit, id: nextSpiritId.current++ }]); setNewSpirit({ name: "", notes: "" }); };
  const removeSpirit = id      => setLocalSpirits(l => l.filter(s => s.id !== id));
  const updSpirit    = (id,f,v) => setLocalSpirits(l => l.map(s => s.id === id ? { ...s, [f]: v } : s));

  // ── Beers ──
  const [localBeers, setLocalBeers] = useState(beers.map(b => ({ ...b })));
  const [newBeer, setNewBeer] = useState({ name: "", notes: "" });
  const nextBeerId = useRef(Math.max(...beers.map(b => b.id), 0) + 1);
  const addBeer    = () => { if (!newBeer.name.trim()) return; setLocalBeers(l => [...l, { ...newBeer, id: nextBeerId.current++ }]); setNewBeer({ name: "", notes: "" }); };
  const removeBeer = id      => setLocalBeers(l => l.filter(b => b.id !== id));
  const updBeer    = (id,f,v) => setLocalBeers(l => l.map(b => b.id === id ? { ...b, [f]: v } : b));

  const handleSave = () => {
    onUpdateDishes(localDishes);
    onUpdateWines(localWines);
    onUpdateCocktails(localCocktails);
    onUpdateSpirits(localSpirits);
    onUpdateBeers(localBeers);
    onClose();
  };

  const TABS = ["wines", "cocktails", "spirits", "beers", "dishes"];
  const tabBtn = t => ({
    fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "9px 18px",
    border: "none", cursor: "pointer", textTransform: "uppercase", transition: "all 0.1s",
    background: tab === t ? "#1a1a1a" : "#fff",
    color: tab === t ? "#fff" : "#444",
    borderBottom: tab === t ? "none" : "1px solid #e8e8e8",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(4px)", zIndex: 500,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderTop: "1px solid #e8e8e8",
        borderRadius: "12px 12px 0 0",
        width: "100%", maxWidth: 580,
        maxHeight: "92vh", overflow: "hidden",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.10)",
        display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e0e0e0", margin: "12px auto 0" }} />

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #e8e8e8", flexShrink: 0, marginTop: 8, overflowX: "auto" }}>
          {TABS.map(t => <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t}</button>)}
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", padding: isMobile ? "20px 16px" : "24px 28px", flex: 1, overflowX: "hidden" }}>

          {/* ── Wines tab ── */}
          {tab === "wines" && (
            <>
              {/* Wine rows */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 70px 52px 28px", gap: 8, marginBottom: 8 }}>
                {(isMobile ? ["Name", "Producer"] : ["Name", "Producer", "Vintage", "Glass", ""]).map((h, i) => (
                  <div key={i} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0", marginBottom: 10 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
                {localWines.map(w => (
                  <div key={w.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr auto" : "1fr 1fr 70px 52px 28px", gap: 8, alignItems: "center" }}>
                    <input value={w.name} onChange={e => updWine(w.id, "name", e.target.value)} style={{ ...baseInp, padding: "5px 8px" }} placeholder="Name" />
                    <input value={w.producer} onChange={e => updWine(w.id, "producer", e.target.value)} style={{ ...baseInp, padding: "5px 8px" }} placeholder="Producer" />
{!isMobile && <input value={w.vintage} onChange={e => updWine(w.id, "vintage", e.target.value)} style={{ ...baseInp, padding: "5px 8px" }} placeholder="2020" />}
                    <button onClick={() => updWine(w.id, "byGlass", !w.byGlass)} style={{
                      fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "5px 6px", border: "1px solid",
                      borderColor: w.byGlass ? "#aaddaa" : "#e8e8e8", borderRadius: 2, cursor: "pointer",
                      background: w.byGlass ? "#f0faf0" : "#fff", color: w.byGlass ? "#4a8a4a" : "#555",
                    }}>{w.byGlass ? "YES" : "NO"}</button>
                    <button onClick={() => removeWine(w.id)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                <div style={fieldLabel}>Add wine</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 70px 52px", gap: 8, marginBottom: 10 }}>
                  <input value={newWine.name} onChange={e => setNewWine(w => ({ ...w, name: e.target.value }))} placeholder="Name" style={{ ...baseInp, padding: "5px 8px" }} />
                  <input value={newWine.producer} onChange={e => setNewWine(w => ({ ...w, producer: e.target.value }))} placeholder="Producer" style={{ ...baseInp, padding: "5px 8px" }} />
                  {!isMobile && <input value={newWine.vintage} onChange={e => setNewWine(w => ({ ...w, vintage: e.target.value }))} placeholder="2020" style={{ ...baseInp, padding: "5px 8px" }} />}
                  <button onClick={() => setNewWine(w => ({ ...w, byGlass: !w.byGlass }))} style={{
                    fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "5px 6px", border: "1px solid",
                    borderColor: newWine.byGlass ? "#aaddaa" : "#e8e8e8", borderRadius: 2, cursor: "pointer",
                    background: newWine.byGlass ? "#f0faf0" : "#fff", color: newWine.byGlass ? "#4a8a4a" : "#555",
                  }}>{newWine.byGlass ? "YES" : "NO"}</button>
                </div>
                <button onClick={addWine} style={{
                  fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "8px 20px",
                  border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff",
                }}>+ ADD WINE</button>
              </div>
            </>
          )}

          {tab === "cocktails" && (
            <DrinkListEditor list={localCocktails} setList={setLocalCocktails}
              newItem={newCocktail} setNewItem={setNewCocktail}
              nextId={nextCocktailId} label="cocktail" />
          )}

          {tab === "spirits" && (
            <DrinkListEditor list={localSpirits} setList={setLocalSpirits}
              newItem={newSpirit} setNewItem={setNewSpirit}
              nextId={nextSpiritId} label="spirit" />
          )}

          {tab === "beers" && (
            <DrinkListEditor list={localBeers} setList={setLocalBeers}
              newItem={newBeer} setNewItem={setNewBeer}
              nextId={nextBeerId} label="beer" />
          )}

          {tab === "dishes" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                {localDishes.map(dish => (
                  <div key={dish.id} style={{ border: "1px solid #f0f0f0", borderRadius: 2, padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <input value={dish.name} onChange={e => updDishName(dish.id, e.target.value)} style={{ ...baseInp, fontWeight: 500, flex: 1 }} />
                      <button onClick={() => removeDish(dish.id)} style={{ background: "none", border: "1px solid #ffcccc", borderRadius: 2, color: "#e07070", cursor: "pointer", fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "6px 10px" }}>REMOVE</button>
                    </div>
                    <div style={{ ...fieldLabel, marginBottom: 8 }}>Pairing options</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {dish.pairings.map((p, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <input value={p} onChange={e => updPairing(dish.id, idx, e.target.value)}
                            style={{ fontFamily: FONT, fontSize: 11, padding: "4px 8px", border: "1px solid #e8e8e8", borderRadius: 2, width: 80, outline: "none", color: "#1a1a1a", background: "#fafafa" }} />
                          {dish.pairings.length > 1 && (
                            <button onClick={() => removePairing(dish.id, idx)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addPairing(dish.id)} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "4px 9px", border: "1px solid #e0e0e0", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#444" }}>+ option</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 18 }}>
                <div style={fieldLabel}>Add dish</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={newDishName} onChange={e => setNewDishName(e.target.value)} onKeyDown={e => e.key === "Enter" && addDish()} placeholder="Dish name…" style={{ ...baseInp, flex: 1 }} />
                  <button onClick={addDish} style={{ fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "8px 16px", border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff", whiteSpace: "nowrap" }}>+ ADD</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "14px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "10px", border: "1px solid #e8e8e8", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#444" }}>CANCEL</button>
          <button onClick={handleSave} style={{ flex: 2, fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "10px", border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff" }}>SAVE</button>
        </div>
      </div>
    </div>
  );
}
// ── Reservation Modal ─────────────────────────────────────────────────────────
function ReservationModal({ table, onSave, onClose }) {
  const isMobile = useIsMobile(700);
  const [name, setName]           = useState(table.resName || "");
  const [time, setTime]           = useState(table.resTime || "");
  const [menuType, setMenuType]   = useState(table.menuType || "");
  const [guests, setGuests]       = useState(table.guests || 2);
  const [guestType, setGuestType] = useState(table.guestType || "");
  const [room, setRoom]           = useState(table.room || "");
  const [birthday, setBirthday]   = useState(table.birthday || false);
  const [restrictions, setRestrictions] = useState(table.restrictions || []);
  const [notes, setNotes]         = useState(table.notes || "");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(4px)", zIndex: 500,
      display: "flex", alignItems: "flex-end",
      justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderTop: "1px solid #e8e8e8",
        borderRadius: "12px 12px 0 0",
        padding: "24px 20px 32px",
        width: "100%", maxWidth: 520,
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.10)",
      }} onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e0e0e0", margin: "0 auto 20px" }} />

        <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#666", marginBottom: 20 }}>
          TABLE {String(table.id).padStart(2,"0")} · RESERVATION
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={fieldLabel}>Name</div>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Guest name…" style={baseInp} />
          </div>

          <div>
            <div style={fieldLabel}>Sitting</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 8 }}>
              {["18:00","18:30","19:00","19:15"].map(t => (
                <button key={t} onClick={() => setTime(t)} style={{
                  fontFamily: FONT, fontSize: 13, letterSpacing: 1,
                  padding: "14px 0", flex: 1, border: "1px solid",
                  borderColor: time === t ? "#1a1a1a" : "#e8e8e8",
                  borderRadius: 2, cursor: "pointer",
                  background: time === t ? "#1a1a1a" : "#fff",
                  color: time === t ? "#fff" : t === "19:15" ? "#555" : "#888",
                  transition: "all 0.12s",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={fieldLabel}>Menu</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Long", "Short"].map(opt => (
                  <button key={opt} onClick={() => setMenuType(m => m === opt ? "" : opt)} style={{
                    fontFamily: FONT, fontSize: 10, letterSpacing: 2,
                    padding: "10px 24px", border: "1px solid",
                    borderColor: menuType === opt ? "#1a1a1a" : "#e8e8e8",
                    borderRadius: 2, cursor: "pointer",
                    background: menuType === opt ? "#1a1a1a" : "#fff",
                    color: menuType === opt ? "#fff" : "#888",
                    textTransform: "uppercase",
                  }}>{opt}</button>
                ))}
              </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr", gap: 16, alignItems: "flex-start" }}>
            <div>
              <div style={fieldLabel}>Guests</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={() => setGuests(g => Math.max(1, g-1))} style={circBtnSm}>−</button>
                <span style={{ fontFamily: FONT, fontSize: 18, color: "#1a1a1a", minWidth: 20, textAlign: "center" }}>{guests}</span>
                <button onClick={() => setGuests(g => Math.min(14, g+1))} style={circBtnSm}>+</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={fieldLabel}>Guest Type</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["hotel","outside"].map(type => (
                  <button key={type} onClick={() => { setGuestType(t => t === type ? "" : type); setRoom(""); }} style={{
                    fontFamily: FONT, fontSize: 11, letterSpacing: 1,
                    padding: "12px 0", flex: 1, border: "1px solid",
                    borderColor: guestType === type ? "#1a1a1a" : "#e8e8e8",
                    borderRadius: 2, cursor: "pointer",
                    background: guestType === type ? "#1a1a1a" : "#fff",
                    color: guestType === type ? "#fff" : "#444",
                    transition: "all 0.12s", textTransform: "uppercase",
                  }}>{type}</button>
                ))}
              </div>
              {guestType === "hotel" && (
                <div style={{ marginTop: 12 }}>
                  <div style={fieldLabel}>Room</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["01","11","12","21","22","23"].map(r => (
                      <button key={r} onClick={() => setRoom(x => x === r ? "" : r)} style={{
                        fontFamily: FONT, fontSize: 13, fontWeight: 500, letterSpacing: 1,
                        padding: "12px 16px", border: "1px solid",
                        borderColor: room === r ? "#c8a06e" : "#e8e8e8",
                        borderRadius: 2, cursor: "pointer",
                        background: room === r ? "#fdf6ec" : "#fff",
                        color: room === r ? "#a07040" : "#444",
                        transition: "all 0.12s",
                      }}>{r}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f0f0f0" }} />

          <div>
            <div style={fieldLabel}>🎂 Birthday Cake</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[true,false].map(val => (
                <button key={String(val)} onClick={() => setBirthday(val)} style={{
                  fontFamily: FONT, fontSize: 12, letterSpacing: 1,
                  padding: "14px 0", flex: 1, border: "1px solid",
                  borderColor: birthday === val ? (val ? "#d4b888" : "#e8e8e8") : "#e8e8e8",
                  borderRadius: 2, cursor: "pointer",
                  background: birthday === val ? (val ? "#fdf8f0" : "#fafafa") : "#fff",
                  color: birthday === val ? (val ? "#a07040" : "#1a1a1a") : "#555",
                  transition: "all 0.12s",
                }}>{val ? "YES" : "NO"}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ ...fieldLabel, marginBottom: 0 }}>⚠️ Restrictions</div>
              <button onClick={() => setRestrictions(r => [...r, { pos: null, note: "" }])} style={{
                fontFamily: FONT, fontSize: 11, letterSpacing: 1,
                padding: "8px 14px", border: "1px solid #e0e0e0",
                borderRadius: 2, cursor: "pointer", background: "#fff", color: "#1a1a1a",
              }}>+ add</button>
            </div>
            {restrictions.length === 0 && <div style={{ fontFamily: FONT, fontSize: 12, color: "#ddd" }}>none</div>}
            {restrictions.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <input value={r.note}
                  onChange={e => setRestrictions(rs => rs.map((x, idx) => idx === i ? { ...x, note: e.target.value } : x))}
                  placeholder="e.g. no gluten, vegetarian…"
                  style={{ ...baseInp, flex: 1, borderColor: r.note ? "#f0c0c088" : "#e8e8e8" }} />
                <button onClick={() => setRestrictions(rs => rs.filter((_, idx) => idx !== i))} style={{
                  background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "0 4px",
                }}>×</button>
              </div>
            ))}
          </div>

          <div>
            <div style={fieldLabel}>📝 Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="VIP, pace, special requests…"
              style={{ ...baseInp, minHeight: 72, resize: "vertical", lineHeight: 1.5 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          <button onClick={onClose} style={{
            flex: 1, fontFamily: FONT, fontSize: 12, letterSpacing: 2,
            padding: "14px", border: "1px solid #e8e8e8", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#444",
          }}>CANCEL</button>
          <button onClick={() => onSave({ name, time, menuType, guests, guestType, room, birthday, restrictions, notes })} style={{
            flex: 2, fontFamily: FONT, fontSize: 12, letterSpacing: 2,
            padding: "14px", border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff",
          }}>SAVE</button>
        </div>
      </div>
    </div>
  );
}

// ── Table Card ────────────────────────────────────────────────────────────────
function Card({ table, mode, onClick, onSeat, onUnseat, onClear, onEditRes }) {
  const hasRes = table.resName || table.resTime;
  const menuLabel = table.menuType ? `${table.menuType} menu` : null;
  return (
    <div style={{
      background: "#fff", border: "1px solid",
      borderColor: table.active ? "#e0e0e0" : hasRes ? "#ebebeb" : "#f5f5f5",
      borderRadius: 2, padding: "16px 14px", cursor: table.active ? "pointer" : "default",
      display: "flex", flexDirection: "column", gap: 8, minHeight: 160,
      opacity: !table.active && !hasRes ? 0.4 : 1,
    }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 300, color: table.active ? "#1a1a1a" : "#666", letterSpacing: 1 }}>
          {String(table.id).padStart(2, "0")}
        </span>
        <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 3 }}>
          {table.birthday                 && <span style={{ fontSize: 11 }}>🎂</span>}
          {table.restrictions?.length > 0 && <span style={{ fontSize: 11 }}>⚠️</span>}
          {table.guestType === "hotel"    && <span style={{ fontFamily: FONT, fontSize: 8, color: "#1a1a1a", letterSpacing: 1, border: "1px solid #e8e8e8", borderRadius: 2, padding: "1px 4px" }}>
            {table.room ? `Hotel #${table.room}` : "H"}
          </span>}
          {menuLabel && <span style={{ fontFamily: FONT, fontSize: 8, color: "#1a1a1a", letterSpacing: 1, border: "1px solid #e8e8e8", borderRadius: 2, padding: "1px 4px" }}>{menuLabel}</span>}
          {table.active                   && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4a9a6a", display: "inline-block" }} />}
        </div>
      </div>

      {hasRes && (
        <div style={{ borderTop: "1px solid #f5f5f5", paddingTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
          {table.resName && <div style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a" }}>{table.resName}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {table.resTime && <span style={{ fontFamily: FONT, fontSize: 10, color: "#444" }}>res. {table.resTime}</span>}
            {table.arrivedAt && <>
              <span style={{ color: "#ddd", fontSize: 10 }}>·</span>
              <span style={{ fontFamily: FONT, fontSize: 10, color: "#4a9a6a" }}>arr. {table.arrivedAt}</span>
            </>}
          </div>
        </div>
      )}

      {table.active && (
        <>
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#666", letterSpacing: 1 }}>{table.guests} guests</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {table.seats.map(s => (
              <div key={s.id} style={{
                width: 7, height: 7, borderRadius: "50%",
                background: s.pairing ? (pairingStyle[s.pairing]?.color || "#e8e8e8") : "#e8e8e8",
              }} />
            ))}
          </div>
          {table.notes && <div style={{ fontFamily: FONT, fontSize: 10, color: "#555", fontStyle: "italic" }}>{table.notes}</div>}
        </>
      )}

      <div style={{ marginTop: "auto", display: "flex", gap: 6, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
        {!table.active && mode === "admin" && (
          <button onClick={onEditRes} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px",
            border: "1px solid #e0e0e0", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#444",
          }}>{(table.resName || table.resTime) ? "edit" : "reserve"}</button>
        )}
        {!table.active && (
          <button onClick={onSeat} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px",
            border: "1px solid #cce8cc", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#70b870",
          }}>seat</button>
        )}
        {table.active && mode === "admin" && (
          <button onClick={onUnseat} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px",
            border: "1px solid #d8d8d8", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#555",
          }}>unseat</button>
        )}
        {table.active && mode === "admin" && (
          <button onClick={onClear} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px",
            border: "1px solid #ffcccc", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#e07070",
          }}>clear</button>
        )}
      </div>
    </div>
  );
}

// ── Detail View ───────────────────────────────────────────────────────────────
function Detail({ table, dishes, wines = [], cocktails = [], spirits = [], beers = [], mode, onBack, upd, updSeat, setGuests, swapSeats }) {
  const isMobile = useIsMobile(860);
  const row1 = isMobile ? "34px 68px 1fr 28px" : "38px 75px 1fr 28px";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "20px 12px 28px" : "24px 16px", overflowX: "hidden" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: FONT, fontSize: 11, color: "#666", letterSpacing: 1, padding: 0, marginBottom: 28, display: "block",
      }}>← all tables</button>

      {/* Table number + guest count */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#555", marginBottom: 6 }}>TABLE</div>
          <div style={{ fontFamily: FONT, fontSize: 48, fontWeight: 300, color: "#1a1a1a", lineHeight: 1 }}>
            {String(table.id).padStart(2, "0")}
          </div>
        </div>
        {mode === "admin" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <button onClick={() => setGuests(Math.max(1, table.guests - 1))} style={circBtnSm}>−</button>
            <span style={{ fontFamily: FONT, fontSize: 11, color: "#444", letterSpacing: 1, minWidth: 70, textAlign: "center" }}>
              {table.guests} guests
            </span>
            <button onClick={() => setGuests(Math.min(14, table.guests + 1))} style={circBtnSm}>+</button>
          </div>
        )}
        {mode === "service" && (
          <span style={{ fontFamily: FONT, fontSize: 11, color: "#444", letterSpacing: 1, marginBottom: 6 }}>
            {table.guests} guests
          </span>
        )}
      </div>

      {/* Reservation strip */}
      {(table.resName || table.resTime || table.arrivedAt || table.menuType) && (
        <div style={{
          display: "grid", gap: 14, alignItems: "start",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(160px, max-content))",
          padding: isMobile ? "12px" : "10px 14px", background: "#fafafa", border: "1px solid #f0f0f0",
          borderRadius: 2, marginBottom: 28,
        }}>
          {table.resName && (
            <div>
              <div style={{ ...fieldLabel, marginBottom: 2 }}>Name</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#1a1a1a" }}>
                {table.resName}
                {table.guestType && <span style={{ fontFamily: FONT, fontSize: 9, color: "#444", marginLeft: 8, letterSpacing: 1, textTransform: "uppercase" }}>{table.guestType}</span>}
                {table.guestType === "hotel" && table.room && <span style={{ fontFamily: FONT, fontSize: 11, color: "#a07040", marginLeft: 6, letterSpacing: 1 }}>· Hotel #{table.room}</span>}
              </div>
            </div>
          )}
          {table.resTime && (
            <div>
              <div style={{ ...fieldLabel, marginBottom: 2 }}>Reserved</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#1a1a1a" }}>{table.resTime}</div>
            </div>
          )}
          {table.menuType && (
            <div>
              <div style={{ ...fieldLabel, marginBottom: 2 }}>Menu</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#1a1a1a" }}>{table.menuType}</div>
            </div>
          )}
          {table.arrivedAt && (
            <div>
              <div style={{ ...fieldLabel, marginBottom: 2 }}>Arrived</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#4a9a6a" }}>{table.arrivedAt}</div>
            </div>
          )}
        </div>
      )}

      {/* Column header row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: row1, gap: 10, alignItems: "center", marginBottom: 4 }}>
        {["", "Water", "Pairing", ""].map((h, i) => (
          <div key={i} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#555", textTransform: "uppercase" }}>{h}</div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #f0f0f0", marginBottom: 2 }} />

      {/* Seat rows */}
      {table.seats.map((seat, si) => {
        const glasses   = seat.glasses   || [];
        const cocktailList = seat.cocktails || [];
        const spiritList   = seat.spirits   || [];
        const seatRestrictions = (table.restrictions || []).filter(r => r.pos === seat.id);
        return (
          <div key={seat.id} style={{
            borderBottom: si < table.seats.length - 1 ? "1px solid #f5f5f5" : "none",
            padding: "10px 0",
          }}>
            {/* ── Line 1: P · [restrictions] · Water · Pairing · Swap ── */}
            <div style={{ display: "grid", gridTemplateColumns: row1, gap: 10, alignItems: "start", marginBottom: 8 }}>
              {/* P bubble */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%", border: "1px solid #ebebeb",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT, fontSize: 9, color: "#444", letterSpacing: 0.5, flexShrink: 0,
                marginTop: 2,
              }}>P{seat.id}</div>

              {/* Water */}
              <WaterPicker value={seat.water} onChange={v => updSeat(seat.id, "water", v)} />

              {/* Pairing */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {PAIRINGS.map(p => {
                  const ps = pairingStyle[p];
                  const on = seat.pairing === p;
                  return (
                    <button key={p} onClick={() => updSeat(seat.id, "pairing", p)} style={{
                      fontFamily: FONT, fontSize: 9, letterSpacing: 0.5,
                      padding: "5px 8px", border: "1px solid",
                      borderColor: on ? ps.border : "#ebebeb", borderRadius: 2, cursor: "pointer",
                      background: on ? ps.bg : "#fff", color: on ? ps.color : "#555",
                      transition: "all 0.1s",
                    }}>{p}</button>
                  );
                })}
                {/* Restriction tags inline */}
                {seatRestrictions.map((r, i) => (
                  <span key={i} style={{
                    fontFamily: FONT, fontSize: 9, letterSpacing: 0.5,
                    padding: "4px 8px", borderRadius: 2,
                    background: "#fff5f5", border: "1px solid #f0c0c0",
                    color: "#c07070", whiteSpace: "nowrap",
                  }}>⚠ {r.note}</span>
                ))}
              </div>

              {/* Swap */}
              {table.seats.length > 1
                ? <SwapPicker seatId={seat.id} totalSeats={table.seats.length} onSwap={t => swapSeats(seat.id, t)} />
                : <div />}
            </div>
            {/* ── Beverages + Extras ── */}
            <div style={{ paddingLeft: isMobile ? 0 : 48, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Unified beverage search */}
              <div style={{ background: "#fcfcfc", border: "1px solid #ececec", borderRadius: 8, padding: isMobile ? "10px" : "12px" }}>
                <div style={{ ...fieldLabel, marginBottom: 8, color: "#444" }}>Beverages</div>
                <BeverageSearch
                  wines={wines} cocktails={cocktails} spirits={spirits} beers={beers}
                  onAdd={({ type, item }) => {
                    if (type === "wine")     updSeat(seat.id, "glasses",   [...(seat.glasses   || []), item]);
                    if (type === "cocktail") updSeat(seat.id, "cocktails", [...(seat.cocktails || []), item]);
                    if (type === "spirit")   updSeat(seat.id, "spirits",   [...(seat.spirits   || []), item]);
                    if (type === "beer")     updSeat(seat.id, "beers",     [...(seat.beers     || []), item]);
                  }}
                />
                {/* Added beverages as chips */}
                {(() => {
                  const allBevs = [
                    ...(seat.glasses   || []).map((x, i) => ({ key: `g${i}`,  type: "wine",     label: x?.name, sub: x?.producer, onRemove: () => updSeat(seat.id, "glasses",   (seat.glasses||[]).filter((_,idx)=>idx!==i)) })),
                    ...(seat.cocktails || []).map((x, i) => ({ key: `c${i}`,  type: "cocktail", label: x?.name, sub: x?.notes,    onRemove: () => updSeat(seat.id, "cocktails", (seat.cocktails||[]).filter((_,idx)=>idx!==i)) })),
                    ...(seat.spirits   || []).map((x, i) => ({ key: `s${i}`,  type: "spirit",   label: x?.name, sub: x?.notes,    onRemove: () => updSeat(seat.id, "spirits",   (seat.spirits||[]).filter((_,idx)=>idx!==i)) })),
                    ...(seat.beers     || []).map((x, i) => ({ key: `b${i}`,  type: "beer",     label: x?.name, sub: x?.notes,    onRemove: () => updSeat(seat.id, "beers",     (seat.beers||[]).filter((_,idx)=>idx!==i)) })),
                  ];
                  if (allBevs.length === 0) return null;
                  return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {allBevs.map(bev => {
                        const ts = BEV_TYPES[bev.type];
                        return (
                          <div key={bev.key} style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "4px 8px 4px 10px", borderRadius: 999,
                            background: ts.bg, border: `1px solid ${ts.border}`,
                          }}>
                            <span style={{ fontFamily: FONT, fontSize: 11, color: ts.color, fontWeight: 500, whiteSpace: "nowrap" }}>
                              {bev.label}{bev.sub ? ` · ${bev.sub}` : ""}
                            </span>
                            <button onClick={bev.onRemove} style={{ background: "none", border: "none", color: ts.color, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 0 0 2px", opacity: 0.7 }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Extra dishes */}
              {dishes.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {dishes.map(dish => {
                    const extra = seat.extras?.[dish.id] || { ordered: false, pairing: dish.pairings[0] };
                    return (
                      <div key={dish.id} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 88 }}>
                        <div style={{ ...fieldLabel, marginBottom: 4 }}>{dish.name}</div>
                        <button onClick={() => updSeat(seat.id, "extras", {
                          ...seat.extras, [dish.id]: { ...extra, ordered: !extra.ordered }
                        })} style={{
                          fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "5px 8px", border: "1px solid",
                          borderColor: extra.ordered ? "#aaddaa" : "#ebebeb", borderRadius: 2, cursor: "pointer",
                          background: extra.ordered ? "#f0faf0" : "#fff", color: extra.ordered ? "#4a8a4a" : "#555",
                          transition: "all 0.1s",
                        }}>{extra.ordered ? "YES" : "NO"}</button>
                        <select value={extra.pairing || dish.pairings[0]} disabled={!extra.ordered}
                          onChange={e => updSeat(seat.id, "extras", { ...seat.extras, [dish.id]: { ...extra, pairing: e.target.value } })}
                          style={{
                            fontFamily: FONT, fontSize: 10, padding: "4px 5px",
                            border: "1px solid #ebebeb", borderRadius: 2,
                            background: "#fff", color: "#1a1a1a", outline: "none",
                            opacity: extra.ordered ? 1 : 0.3, width: "100%",
                          }}>
                          {dish.pairings.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ borderTop: "1px solid #ebebeb", margin: "28px 0" }} />

      {/* Table-wide fields */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
        <div>
          <div style={fieldLabel}>🍾 Bottle</div>
          <WineSearch wineObj={table.bottleWine} wines={wines} byGlass={false} placeholder="search bottle…" onChange={w => upd("bottleWine", w)} />
        </div>
        <div>
          <div style={fieldLabel}>Menu</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Long", "Short"].map(opt => (
              <button key={opt} onClick={() => upd("menuType", table.menuType === opt ? "" : opt)} style={{
                fontFamily: FONT, fontSize: 10, letterSpacing: 2,
                padding: "9px 22px", border: "1px solid",
                borderColor: table.menuType === opt ? "#1a1a1a" : "#e8e8e8",
                borderRadius: 2, cursor: "pointer",
                background: table.menuType === opt ? "#1a1a1a" : "#fff",
                color: table.menuType === opt ? "#fff" : "#888",
                textTransform: "uppercase",
              }}>{opt}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={fieldLabel}>⚠️ Restrictions</div>
          {table.restrictions?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {table.restrictions.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 10px", background: "#fafafa",
                  border: "1px solid #f0c0c066", borderRadius: 2,
                }}>
                  <select value={r.pos ?? ""} onChange={e => upd("restrictions", table.restrictions.map((x, idx) =>
                    idx === i ? { ...x, pos: e.target.value ? Number(e.target.value) : null } : x
                  ))} style={{
                    fontFamily: FONT, fontSize: 11, fontWeight: 500,
                    padding: "4px 6px", border: "1px solid #e0e0e0",
                    borderRadius: 2, background: r.pos ? "#f0f0f0" : "#fff",
                    color: r.pos ? "#1a1a1a" : "#666", outline: "none",
                    flexShrink: 0, width: 58, cursor: "pointer",
                  }}>
                    <option value="">P?</option>
                    {Array.from({ length: table.guests }, (_, idx) => (
                      <option key={idx+1} value={idx+1}>P{idx+1}</option>
                    ))}
                  </select>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a", flex: 1 }}>{r.note}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: FONT, fontSize: 11, color: "#ddd" }}>none</div>
          )}
        </div>
        <div>
          <div style={fieldLabel}>🎂 Birthday Cake</div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: table.birthday ? "#a07040" : "#555" }}>
            {table.birthday ? "YES" : "NO"}
          </div>
        </div>
        <div>
          <div style={fieldLabel}>📝 Notes</div>
          <textarea value={table.notes} onChange={e => upd("notes", e.target.value)}
            placeholder="VIP, pace, special requests…"
            style={{ ...baseInp, minHeight: 68, resize: "vertical", lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}


// ── Table Seat Detail (read-only, used in DisplayBoard) ───────────────────────
function TableSeatDetail({ table, dishes, isMobile }) {
  const pairingColors = {
    "Non-Alc":  { color: "#1f5f73", bg: "#e8f7fb",  border: "#7fc6db" },
    "Wine":      { color: "#7a5020", bg: "#f5ead8",  border: "#c8a060" },
    "Premium":   { color: "#3a3a7a", bg: "#eaeaf5",  border: "#8888bb" },
    "Our Story": { color: "#2a6a4a", bg: "#e0f5ea",  border: "#5aaa7a" },
  };

  const chip = (label, color, bg, border, bold = false) => (
    <span style={{
      fontFamily: FONT, fontSize: 11, letterSpacing: 0.5,
      padding: "4px 10px", borderRadius: 2,
      color, background: bg, border: `1px solid ${border}`,
      whiteSpace: "nowrap", fontWeight: bold ? 500 : 400,
    }}>{label}</span>
  );

  return (
    <>
      {table.notes && (
        <div style={{
          fontFamily: FONT, fontSize: 12, color: "#555", fontStyle: "italic",
          padding: "10px 14px", background: "#f8f8f8", border: "1px solid #e8e8e8",
          borderRadius: 2, marginBottom: 20,
        }}>{table.notes}</div>
      )}
      {(table.restrictions || []).filter(r => !r.pos && r.note).length > 0 && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fef0f0", border: "1px solid #e09090", borderRadius: 2 }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 3, color: "#b04040", marginBottom: 6, textTransform: "uppercase" }}>
            ⚠ Unassigned restrictions
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {table.restrictions.filter(r => !r.pos && r.note).map((r, i) => (
              <span key={i} style={{ fontFamily: FONT, fontSize: 11, color: "#b04040", fontWeight: 500 }}>{r.note}</span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {table.seats.map(seat => {
          const seatRestrictions = (table.restrictions || []).filter(r => r.pos === seat.id);
          const seatExtras = dishes.filter(d => seat.extras?.[d.id]?.ordered);
          const ws = waterStyle(seat.water);
          const pc = pairingColors[seat.pairing] || pairingColors["Non-Alc"];
          const hasInfo = seatRestrictions.length > 0 || seatExtras.length > 0;
          return (
            <div key={seat.id} style={{ border: "1px solid #ececec", borderRadius: 10, padding: "12px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    border: `1px solid ${seatRestrictions.length ? "#e08080" : "#d0d0d0"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT, fontSize: 10, fontWeight: 600,
                    color: seatRestrictions.length ? "#b04040" : "#444",
                  }}>P{seat.id}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{
                    fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                    padding: "4px 10px", borderRadius: 999,
                    background: seat.water === "—" ? "#f5f5f5" : (ws.bg || "#f0f0f0"),
                    color: seat.water === "—" ? "#666" : "#1a1a1a", border: "1px solid #e0e0e0",
                  }}>{seat.water}</span>
                  {seat.pairing && <span style={{
                    fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.4,
                    padding: "4px 10px", borderRadius: 999,
                    background: pc.bg, border: `1px solid ${pc.border}`, color: pc.color,
                  }}>{seat.pairing}</span>}
                </div>
              </div>
              {hasInfo ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {seatRestrictions.map((r, i) => (
                    <span key={i} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, letterSpacing: 0.3, padding: "4px 9px", borderRadius: 999, background: "#fef0f0", border: "1px solid #e09090", color: "#b04040" }}>⚠ {r.note}</span>
                  ))}
                  {seatExtras.map(d => {
                    const ex = seat.extras[d.id];
                    return <span key={d.id} style={{ fontFamily: FONT, fontSize: 11, letterSpacing: 0.3, padding: "4px 9px", borderRadius: 999, background: "#e8f5e8", border: "1px solid #88cc88", color: "#2a6a2a" }}>{d.name}{ex.pairing && ex.pairing !== "—" ? ` · ${ex.pairing}` : ""}</span>;
                  })}
                </div>
              ) : <div style={{ fontFamily: FONT, fontSize: 11, color: "#777" }}>No extra notes</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Display Board ─────────────────────────────────────────────────────────────
function DisplayBoard({ tables, dishes }) {
  const [sel, setSel]      = useState(null);
  const [expanded, setExp] = useState(null);
  const isMobile = useIsMobile(700);

  const sorted = [...tables].sort((a, b) => {
    const rank = t => t.active ? 0 : (t.resTime ? 1 : 2);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const timeA = a.arrivedAt || a.resTime || "99:99";
    const timeB = b.arrivedAt || b.resTime || "99:99";
    return timeA.localeCompare(timeB);
  });
  const visible = sorted.filter(t => t.active || t.resTime || t.resName);

  useEffect(() => {
    const firstActive = sorted.find(t => t.active);
    if (sel === null && firstActive) setSel(firstActive.id);
  }, [tables]);

  const chip = (label, color, bg, border, bold = false) => (
    <span style={{
      fontFamily: FONT, fontSize: 11, letterSpacing: 0.5,
      padding: "4px 10px", borderRadius: 2,
      color, background: bg, border: `1px solid ${border}`,
      whiteSpace: "nowrap", fontWeight: bold ? 500 : 400,
    }}>{label}</span>
  );

  // ── MOBILE layout ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ overflowY: "auto", overflowX: "hidden", padding: "12px 12px 40px", background: "#fafafa", minHeight: "calc(100vh - 52px)" }}>
        {visible.length === 0 && (
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#666", textAlign: "center", marginTop: 60, letterSpacing: 2 }}>
            no active tables
          </div>
        )}
        {visible.map(t => {
          const isOpen   = expanded === t.id;
          const isSeated = t.active;
          const hasRestr = (t.restrictions || []).some(r => r.note);
          return (
            <div key={t.id} style={{
              background: isSeated ? "#f8fcf9" : "#fbfcfe", borderRadius: 10,
              border: `1px solid ${isSeated ? "#9bd0aa" : "#d9e5f2"}`,
              marginBottom: 10,
              boxShadow: isOpen ? "0 8px 24px rgba(0,0,0,0.08)" : "0 1px 0 rgba(0,0,0,0.02)",
              transition: "box-shadow 0.15s", overflow: "hidden",
            }}>
              <div style={{ height: 4, background: isSeated ? "#7bc492" : "#7faedb" }} />
              <div onClick={() => setExp(isOpen ? null : t.id)} style={{
                padding: "16px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
              }}>
                <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 300, color: isSeated ? "#1a1a1a" : "#444", minWidth: 36, lineHeight: 1 }}>
                  {String(t.id).padStart(2,"0")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {t.resName && (
                    <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#1a1a1a", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.resName}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {t.resTime  && <span style={{ fontFamily: FONT, fontSize: 11, color: "#1a1a1a", fontWeight: 500 }}>res. {t.resTime}</span>}
                    {t.arrivedAt && <span style={{ fontFamily: FONT, fontSize: 11, color: "#4a9a6a", fontWeight: 500 }}>arr. {t.arrivedAt}</span>}
                    {isSeated
                      ? <span style={{ fontFamily: FONT, fontSize: 9, color: "#2f7a45", letterSpacing: 1, border: "1px solid #9bd0aa", borderRadius: 999, padding: "3px 8px", background: "#ecf8ef", fontWeight: 700 }}>SEATED</span>
                      : <span style={{ fontFamily: FONT, fontSize: 9, color: "#9a6a18", letterSpacing: 1, border: "1px solid #e8d8b8", borderRadius: 999, padding: "3px 8px", background: "#fff8ea", fontWeight: 700 }}>RESERVED</span>
                    }
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {t.birthday  && <span style={{ fontSize: 14 }}>🎂</span>}
                  {t.menuType  && <span style={{ fontFamily: FONT, fontSize: 8, color: "#1a1a1a", border: "1px solid #e8e8e8", borderRadius: 2, padding: "3px 6px" }}>{t.menuType}</span>}
                  {hasRestr    && <span style={{ fontSize: 14 }}>⚠️</span>}
                  {t.guestType === "hotel" && t.room && (
                    <span style={{ fontFamily: FONT, fontSize: 9, color: "#a07040", border: "1px solid #d4b888", borderRadius: 2, padding: "3px 6px", fontWeight: 500 }}>#{t.room}</span>
                  )}
                  <span style={{
                    fontFamily: FONT, fontSize: 16, color: "#555",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s", display: "inline-block", lineHeight: 1, marginLeft: 4,
                  }}>⌄</span>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: "1px solid #f0f0f0", padding: "16px 16px 20px", background: "#fff" }}>
                  {(t.guestType === "hotel" || t.arrivedAt || t.resTime || t.menuType) && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                      {t.guestType === "hotel" && t.room && chip(`Hotel #${t.room}`, "#7a5020", "#f5ead8", "#c8a060", true)}
                      {t.menuType  && chip(`${t.menuType} menu`, "#333", "#f8f8f8", "#d8d8d8", true)}
                      {t.resTime   && chip(`res. ${t.resTime}`,   "#555", "#f0f0f0", "#d8d8d8")}
                      {t.arrivedAt && chip(`arr. ${t.arrivedAt}`, "#2a6a3a", "#e0f5ea", "#7acc8a", true)}
                      {chip(`${t.guests} guest${t.guests === 1 ? "" : "s"}`, "#333", "#f5f5f5", "#dedede", true)}
                      {t.birthday  && chip("🎂 birthday", "#7a5020", "#fdf0e0", "#d4b888", true)}
                    </div>
                  )}
                  <TableSeatDetail table={t} dishes={dishes} isMobile={true} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── DESKTOP layout: split panel ──────────────────────────────────────────────
  const table = tables.find(t => t.id === sel);
  return (
    <div style={{ display: "flex", height: "calc(100vh - 52px)", overflow: "hidden" }}>
      <div style={{
        width: 220, flexShrink: 0, borderRight: "1px solid #e8e8e8",
        overflowY: "auto", padding: "16px 0", background: "#fafafa",
      }}>
        {visible.length === 0 && (
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#666", padding: "20px", letterSpacing: 1 }}>no reservations</div>
        )}
        {visible.map(t => {
          const isSel    = t.id === sel;
          const isSeated = t.active;
          return (
            <div key={t.id} onClick={() => setSel(t.id)} style={{
              padding: "14px 20px", cursor: "pointer",
              background: isSel ? "#fff" : isSeated ? "#f8fcf9" : "transparent",
              borderLeft: isSel ? "2px solid #1a1a1a" : isSeated ? "2px solid #7bc492" : "2px solid transparent",
              borderBottom: "1px solid #f0f0f0", transition: "all 0.1s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 400, color: "#1a1a1a", letterSpacing: 1 }}>
                    {String(t.id).padStart(2,"0")}
                  </span>
                  {isSeated && <span style={{ fontFamily: FONT, fontSize: 8, color: "#2f7a45", border: "1px solid #9bd0aa", background: "#ecf8ef", borderRadius: 2, padding: "2px 5px", fontWeight: 600, letterSpacing: 1 }}>SEATED</span>}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {t.birthday && <span style={{ fontSize: 11 }}>🎂</span>}
                  {t.menuType && <span style={{ fontFamily: FONT, fontSize: 8, color: "#1a1a1a", border: "1px solid #e8e8e8", borderRadius: 2, padding: "2px 5px" }}>{t.menuType}</span>}
                  {(t.restrictions||[]).some(r => r.note) && <span style={{ fontSize: 11 }}>⚠️</span>}
                  {t.guestType === "hotel" && (
                    <span style={{ fontFamily: FONT, fontSize: 8, color: "#a07040", border: "1px solid #d4b888", borderRadius: 2, padding: "2px 5px", fontWeight: 500 }}>
                      {t.room ? `#${t.room}` : "H"}
                    </span>
                  )}
                </div>
              </div>
              {t.resName && <div style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a", fontWeight: 500, marginBottom: 3 }}>{t.resName}</div>}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {t.resTime   && <span style={{ fontFamily: FONT, fontSize: 10, color: "#1a1a1a", fontWeight: 500 }}>res. {t.resTime}</span>}
                {t.arrivedAt && <span style={{ fontFamily: FONT, fontSize: 10, color: "#4a9a6a", fontWeight: 500 }}>arr. {t.arrivedAt}</span>}
                {!isSeated   && <span style={{ fontFamily: FONT, fontSize: 8, color: "#2f5f8a", border: "1px solid #c6d7ea", background: "#eef5fb", borderRadius: 2, padding: "2px 5px", fontWeight: 600, letterSpacing: 1 }}>RESERVED</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "36px 48px", background: "#fff" }}>
        {!table ? (
          <div style={{ fontFamily: FONT, fontSize: 11, color: "#666", marginTop: 60, textAlign: "center", letterSpacing: 2 }}>
            SELECT A TABLE
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#444", marginBottom: 4 }}>TABLE</div>
                <div style={{ fontFamily: FONT, fontSize: 52, fontWeight: 300, lineHeight: 1, color: "#1a1a1a" }}>
                  {String(table.id).padStart(2,"0")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 8 }}>
                {table.guestType === "hotel" && table.room && chip(`Hotel #${table.room}`, "#7a5020", "#f5ead8", "#c8a060", true)}
                {table.menuType  && chip(`${table.menuType} menu`, "#333", "#f8f8f8", "#d8d8d8", true)}
                {table.resTime   && chip(`res. ${table.resTime}`, "#555", "#f0f0f0", "#d8d8d8")}
                {table.arrivedAt && chip(`arr. ${table.arrivedAt}`, "#2a6a3a", "#e0f5ea", "#7acc8a", true)}
                {chip(`${table.guests} guest${table.guests === 1 ? "" : "s"}`, "#333", "#f5f5f5", "#dedede", true)}
                {table.birthday  && chip("🎂 birthday", "#7a5020", "#fdf0e0", "#d4b888", true)}
              </div>
            </div>
            {table.resName && (
              <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 500, color: "#1a1a1a", marginBottom: 28 }}>{table.resName}</div>
            )}
            <TableSeatDetail table={table} dishes={dishes} isMobile={false} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ modeLabel, showSummary, showMenu, showArchive, syncLabel, syncLive, activeCount, reserved, seated, onSummary, onMenu, onArchive, onExit }) {
  const modeColor = modeLabel === "ADMIN" ? "#4b4b88" : modeLabel === "SERVICE" ? "#2f7a45" : "#555";
  return (
    <div style={{
      borderBottom: "1px solid #f0f0f0", padding: "10px 12px",
      display: "flex", flexDirection: "column", gap: 10,
      background: "#fff", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 4, color: "#1a1a1a" }}>MILKA</span>
          <span style={{ width: 1, height: 14, background: "#e8e8e8" }} />
          <span style={{ fontSize: 10, letterSpacing: 3, color: modeColor, textTransform: "uppercase", fontWeight: 700 }}>{modeLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {showSummary && (
            <button onClick={onSummary} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px", border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer", background: "#fff", color: "#1a1a1a" }}>SUMMARY</button>
          )}
          {showMenu && (
            <button onClick={onMenu} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px", border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer", background: "#fff", color: "#1a1a1a" }}>MENU</button>
          )}
          {showArchive && (
            <button onClick={onArchive} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px", border: "1px solid #e8d8b8", borderRadius: 999, cursor: "pointer", background: "#fff8f0", color: "#8a6030" }}>ARCHIVE</button>
          )}
          <span style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px",
            border: `1px solid ${syncLive ? "#8fc39f" : "#d8d8d8"}`,
            borderRadius: 999,
            background: syncLive ? "#eef8f1" : "#f6f6f6",
            color: syncLive ? "#2f7a45" : "#555",
            fontWeight: 600, whiteSpace: "nowrap",
          }}>{syncLabel}</span>
          <button onClick={onExit} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px", border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer", background: "#fff", color: "#1a1a1a", flexShrink: 0 }}>EXIT</button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={topStatChip}>{activeCount} seated</span>
        <span style={topStatChip}>{reserved} reserved</span>
        <span style={topStatChip}>{seated} guests</span>
      </div>
    </div>
  );
}

// ── Summary Modal ─────────────────────────────────────────────────────────────
// ── Shared full-screen modal shell ────────────────────────────────────────────
function FullModal({ title, onClose, actions, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Sticky top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 54, borderBottom: "1px solid #ebebeb",
        background: "#fff", flexShrink: 0,
      }}>
        <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#888", textTransform: "uppercase" }}>{title}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {actions}
          <button onClick={onClose} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "8px 16px",
            border: "1px solid #e0e0e0", borderRadius: 2,
            cursor: "pointer", background: "#fff", color: "#555",
          }}>✕ CLOSE</button>
        </div>
      </div>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px 60px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Summary Modal ─────────────────────────────────────────────────────────────
function SummaryModal({ tables, dishes = [], onClose }) {
  const active = tables.filter(t => t.active || t.arrivedAt);
  const pairingColor = { "Wine": "#8a6030", "Non-Alc": "#1f5f73", "Premium": "#3a3a7a", "Our Story": "#2a6a4a" };
  const pairingBg    = { "Wine": "#fdf4e8", "Non-Alc": "#e8f7fb", "Premium": "#eaeaf5", "Our Story": "#e0f5ea" };

  const copyText = () => {
    const lines = [];
    active.forEach(t => {
      lines.push(`TABLE ${String(t.id).padStart(2,"0")}${t.resName ? " · " + t.resName : ""}${t.arrivedAt ? " [arr. " + t.arrivedAt + "]" : ""}`);
      if (t.menuType) lines.push(`  Menu: ${t.menuType}`);
      t.seats.forEach(s => {
        const parts = [`P${s.id}`];
        if (s.water && s.water !== "—") parts.push(`water:${s.water}`);
        if (s.pairing) parts.push(s.pairing);
        const gs = (s.glasses   || []).map(w => w?.name).filter(Boolean);
        const cs = (s.cocktails || []).map(c => c?.name).filter(Boolean);
        const sp = (s.spirits   || []).map(x => x?.name).filter(Boolean);
        const bs = (s.beers     || []).map(x => x?.name).filter(Boolean);
        if (gs.length) parts.push("glass:"    + gs.join(","));
        if (cs.length) parts.push("cocktail:" + cs.join(","));
        if (sp.length) parts.push("spirit:"   + sp.join(","));
        if (bs.length) parts.push("beer:"     + bs.join(","));
        const extras = dishes.filter(d => s.extras?.[d.id]?.ordered);
        if (extras.length) parts.push(extras.map(d => d.name).join(","));
        const restr = (t.restrictions || []).filter(r => r.pos === s.id);
        if (restr.length) parts.push("⚠" + restr.map(r => r.note).join(","));
        lines.push("  " + parts.join(" | "));
      });
      lines.push("");
    });
    navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
  };

  return (
    <FullModal title="Service Summary" onClose={onClose} actions={
      <button onClick={copyText} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "8px 16px", border: "1px solid #e0e0e0", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#555" }}>COPY TEXT</button>
    }>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {active.length === 0 && (
          <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", textAlign: "center", padding: "80px 0" }}>No active tables</div>
        )}
        {active.map(t => (
          <div key={t.id} style={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "12px 16px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 300, color: "#1a1a1a", letterSpacing: 1, lineHeight: 1 }}>{String(t.id).padStart(2,"0")}</span>
              {t.resName   && <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{t.resName}</span>}
              {t.arrivedAt && <span style={{ fontFamily: FONT, fontSize: 11, color: "#4a9a6a", fontWeight: 500 }}>arr. {t.arrivedAt}</span>}
              {t.menuType  && <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px", border: "1px solid #e0e0e0", borderRadius: 2, color: "#555", background: "#fff" }}>{t.menuType}</span>}
              {t.birthday  && <span style={{ fontSize: 14 }}>🎂</span>}
              {t.notes     && <span style={{ fontFamily: FONT, fontSize: 10, color: "#999", fontStyle: "italic", marginLeft: "auto" }}>{t.notes}</span>}
            </div>
            <div style={{ padding: "8px 12px 12px" }}>
              {t.seats.map(s => {
                const ws      = waterStyle(s.water);
                const restr   = (t.restrictions || []).filter(r => r.pos === s.id);
                const extras  = dishes.filter(d => s.extras?.[d.id]?.ordered);
                const allBevs = [
                  ...(s.glasses   || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.wine })),
                  ...(s.cocktails || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.cocktail })),
                  ...(s.spirits   || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.spirit })),
                  ...(s.beers     || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.beer })),
                ];
                return (
                  <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", padding: "8px 4px", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: restr.length ? "#b04040" : "#999", minWidth: 28, letterSpacing: 0.5 }}>P{s.id}</span>
                    {s.water !== "—" && <span style={{ fontFamily: FONT, fontSize: 10, padding: "2px 8px", borderRadius: 2, background: ws.bg || "#f5f5f5", color: "#333", border: "1px solid #e0e0e0" }}>{s.water}</span>}
                    {s.pairing && <span style={{ fontFamily: FONT, fontSize: 10, padding: "2px 8px", borderRadius: 2, border: "1px solid #e0e0e0", color: pairingColor[s.pairing] || "#555", background: pairingBg[s.pairing] || "#fafafa" }}>{s.pairing}</span>}
                    {allBevs.map((b, i) => <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "2px 8px", borderRadius: 2, border: `1px solid ${b.ts.border}`, color: b.ts.color, background: b.ts.bg }}>{b.label}</span>)}
                    {extras.map(d  => <span key={d.id} style={{ fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2, border: "1px solid #88cc88", color: "#2a6a2a", background: "#e8f5e8" }}>{d.name}</span>)}
                    {restr.map((r, i) => <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2, border: "1px solid #e09090", color: "#b04040", background: "#fef0f0" }}>⚠ {r.note}</span>)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </FullModal>
  );
}

// ── Archive Modal ─────────────────────────────────────────────────────────────
function ArchiveModal({ tables, dishes, onArchiveAndClear, onClearAll, onClose }) {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const pairingColor = { "Wine": "#8a6030", "Non-Alc": "#1f5f73", "Premium": "#3a3a7a", "Our Story": "#2a6a4a" };
  const pairingBg    = { "Wine": "#fdf4e8", "Non-Alc": "#e8f7fb", "Premium": "#eaeaf5", "Our Story": "#e0f5ea" };

  const loadEntries = () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    supabase.from("service_archive").select("*").order("created_at", { ascending: false }).limit(30)
      .then(({ data, error }) => { setEntries(error ? [] : (data || [])); setLoading(false); });
  };
  useEffect(loadEntries, []);

  const activeTables = tables.filter(t => t.active || t.arrivedAt || t.resName || t.resTime);

  const archiveActions = (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onClearAll} style={{
        fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "8px 14px",
        border: "1px solid #e8e8e8", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#888",
      }}>CLEAR ALL</button>
      <button onClick={async () => { await onArchiveAndClear(); loadEntries(); }} style={{
        fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "8px 16px",
        border: "1px solid #c8a06e", borderRadius: 2, cursor: "pointer", background: "#fdf8f0", color: "#8a6030",
      }}>ARCHIVE &amp; CLEAR ({activeTables.length})</button>
    </div>
  );

  return (
    <FullModal title="Archive · End of Day" onClose={onClose} actions={archiveActions}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {!supabase && (
          <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", padding: "60px 0", textAlign: "center" }}>
            Supabase not connected — archive unavailable offline
          </div>
        )}
        {supabase && loading && <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", padding: "60px 0", textAlign: "center" }}>Loading…</div>}
        {supabase && !loading && entries.length === 0 && (
          <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", padding: "60px 0", textAlign: "center" }}>No archived services yet</div>
        )}
        {entries.map(entry => {
          const isExp        = expanded === entry.id;
          const entryTables  = entry.state?.tables || [];
          const totalGuests  = entryTables.reduce((a, t) => a + (t.guests || 0), 0);
          return (
            <div key={entry.id} style={{ border: "1px solid #f0f0f0", borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
              <div onClick={() => setExpanded(isExp ? null : entry.id)} style={{
                padding: "14px 16px", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "space-between",
                background: isExp ? "#fafafa" : "#fff",
              }}>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#1a1a1a", marginBottom: 3 }}>{entry.label}</div>
                  <div style={{ fontFamily: FONT, fontSize: 10, color: "#999" }}>{entryTables.length} tables · {totalGuests} guests</div>
                </div>
                <span style={{ fontFamily: FONT, fontSize: 16, color: "#ccc", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.18s", display: "inline-block" }}>⌄</span>
              </div>
              {isExp && (
                <div style={{ borderTop: "1px solid #f0f0f0" }}>
                  {entryTables.map(t => (
                    <div key={t.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f8f8f8" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 300, color: "#1a1a1a", letterSpacing: 1 }}>{String(t.id).padStart(2,"0")}</span>
                        {t.resName   && <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500 }}>{t.resName}</span>}
                        {t.arrivedAt && <span style={{ fontFamily: FONT, fontSize: 10, color: "#4a9a6a" }}>arr. {t.arrivedAt}</span>}
                        {t.menuType  && <span style={{ fontFamily: FONT, fontSize: 9, padding: "2px 7px", border: "1px solid #e8e8e8", borderRadius: 2, color: "#555" }}>{t.menuType}</span>}
                        {t.birthday  && <span style={{ fontSize: 12 }}>🎂</span>}
                      </div>
                      {(t.seats || []).map(s => {
                        const ws      = waterStyle(s.water);
                        const restr   = (t.restrictions || []).filter(r => r.pos === s.id);
                        const extras  = (entry.state?.dishes || dishes).filter(d => s.extras?.[d.id]?.ordered);
                        const allBevs = [
                          ...(s.glasses   || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.wine })),
                          ...(s.cocktails || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.cocktail })),
                          ...(s.spirits   || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.spirit })),
                          ...(s.beers     || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.beer })),
                        ];
                        return (
                          <div key={s.id} style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", padding: "6px 4px", borderBottom: "1px solid #fafafa" }}>
                            <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "#999", minWidth: 26 }}>P{s.id}</span>
                            {s.water !== "—" && <span style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, background: ws.bg || "#f0f0f0", color: "#444", border: "1px solid #e0e0e0" }}>{s.water}</span>}
                            {s.pairing && <span style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, color: pairingColor[s.pairing] || "#555", background: pairingBg[s.pairing] || "#fafafa", border: "1px solid #e0e0e0" }}>{s.pairing}</span>}
                            {allBevs.map((b, i) => <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, border: `1px solid ${b.ts.border}`, color: b.ts.color, background: b.ts.bg }}>{b.label}</span>)}
                            {extras.map(d => <span key={d.id} style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, border: "1px solid #88cc88", color: "#2a6a2a", background: "#e8f5e8" }}>{d.name}</span>)}
                            {restr.map((r, i) => <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, border: "1px solid #e09090", color: "#b04040", background: "#fef0f0" }}>⚠ {r.note}</span>)}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FullModal>
  );
}

// ── Access gate constants ─────────────────────────────────────────────────────
const PINS            = { admin: "3412" };
const ACCESS_PASSWORD = "milka2025";          // ← change to your own password
const ACCESS_KEY      = "milka_access";
const ACCESS_TTL_MS   = 12 * 60 * 60 * 1000; // 12 hours

const readAccess = () => {
  try {
    const raw = localStorage.getItem(ACCESS_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < ACCESS_TTL_MS;
  } catch { return false; }
};
const writeAccess = () => {
  try { localStorage.setItem(ACCESS_KEY, JSON.stringify({ ts: Date.now() })); } catch {}
};

// ── GateScreen — password wall before anything else ───────────────────────────
function GateScreen({ onPass }) {
  const [pw, setPw]       = useState("");
  const [shake, setShake] = useState(false);
  const [show, setShow]   = useState(false);

  const attempt = val => {
    if (val === ACCESS_PASSWORD) {
      writeAccess();
      onPass();
    } else {
      setShake(true);
      setTimeout(() => { setShake(false); setPw(""); }, 600);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#fff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: FONT, padding: "20px 16px",
    }}>
      <GlobalStyle />
      <div style={{ marginBottom: 52, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: 6, color: "#1a1a1a", marginBottom: 6 }}>MILKA</div>
        <div style={{ fontSize: 9, letterSpacing: 4, color: "#555" }}>SERVICE BOARD</div>
      </div>

      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 10, letterSpacing: 3, color: "#888", marginBottom: 28, textTransform: "uppercase" }}>
          enter password
        </div>

        <div style={{ animation: shake ? "shake 0.4s ease" : "none", marginBottom: 12 }}>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && attempt(pw)}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                ...baseInp,
                textAlign: "center",
                letterSpacing: show ? 2 : 6,
                fontSize: MOBILE_SAFE_INPUT_SIZE,
                paddingRight: 44,
                borderColor: shake ? "#f0c0c0" : "#e8e8e8",
                transition: "border-color 0.2s",
              }}
              placeholder="••••••••"
            />
            <button onClick={() => setShow(s => !s)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#bbb", fontSize: 13, padding: 0, lineHeight: 1,
            }}>{show ? "hide" : "show"}</button>
          </div>
        </div>

        <button onClick={() => attempt(pw)} style={{
          width: "100%", fontFamily: FONT, fontSize: 11, letterSpacing: 3,
          padding: "14px", border: "1px solid #1a1a1a", borderRadius: 2,
          cursor: "pointer", background: "#1a1a1a", color: "#fff",
          textTransform: "uppercase", marginTop: 8,
        }}>Enter</button>
      </div>

      <style>{`@keyframes shake {
        0%,100%{transform:translateX(0)}
        20%{transform:translateX(-8px)} 40%{transform:translateX(8px)}
        60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
      }`}</style>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onEnter }) {
  const MODES = [
    { id: "display",  label: "Display",  sub: "read-only view",      icon: "◎", pin: false },
    { id: "service",  label: "Service",  sub: "full service access",  icon: "◈", pin: false },
    { id: "admin",    label: "Admin",    sub: "pin required",         icon: "◆", pin: true  },
  ];
  const [picking, setPicking] = useState(null);
  const [pin, setPin]         = useState("");
  const [shake, setShake]     = useState(false);

  const handleTile = mode => {
    if (!mode.pin) { onEnter(mode.id); return; }
    setPicking(mode.id);
    setPin("");
  };

  const handleDigit = d => {
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === PINS[picking]) {
        onEnter(picking);
        setPicking(null);
      } else {
        setShake(true);
        setPin("");
        setTimeout(() => setShake(false), 500);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <GlobalStyle />
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, letterSpacing: 6, color: "#1a1a1a", marginBottom: 8 }}>MILKA</div>
        <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#999" }}>SERVICE BOARD</div>
      </div>

      {!picking ? (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 480 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => handleTile(m)} style={{
              fontFamily: FONT, cursor: "pointer",
              background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
              padding: "28px 32px", width: 140, textAlign: "center",
              transition: "all 0.12s", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 24, color: "#444" }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "#1a1a1a", fontWeight: 500 }}>{m.label.toUpperCase()}</div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: "#999", marginTop: 4 }}>{m.sub}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", maxWidth: 320 }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#666" }}>ENTER PIN</div>
          <div style={{
            display: "flex", gap: 14, animation: shake ? "shake 0.4s" : "none",
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: "50%",
                background: i < pin.length ? "#1a1a1a" : "#e8e8e8",
                transition: "background 0.1s",
              }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%" }}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
              <button key={i} onClick={() => {
                if (d === "⌫") setPin(p => p.slice(0,-1));
                else if (d !== "") handleDigit(d);
              }} disabled={d === ""} style={{
                fontFamily: FONT, fontSize: 22, fontWeight: 300,
                padding: "18px 0", border: "1px solid #e8e8e8", borderRadius: 2,
                background: d === "" ? "transparent" : "#fff", cursor: d === "" ? "default" : "pointer",
                color: "#1a1a1a", letterSpacing: 1,
                opacity: d === "" ? 0 : 1,
                transition: "all 0.08s",
              }}>{d}</button>
            ))}
          </div>
          <button onClick={() => { setPicking(null); setPin(""); }} style={{
            fontFamily: FONT, fontSize: 10, letterSpacing: 2, color: "#999",
            background: "none", border: "none", cursor: "pointer", padding: 8,
          }}>CANCEL</button>
          <style>{`@keyframes shake {
            0%{transform:translateX(0)} 20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)} 60%{transform:translateX(-5px)}
            80%{transform:translateX(5px)} 100%{transform:translateX(0)}
          }`}</style>
        </div>
      )}
    </div>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; color: #1a1a1a; }
      input, textarea, select { font-size: ${MOBILE_SAFE_INPUT_SIZE}px; }
      button, a, label { touch-action: manipulation; }
    `}</style>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const localSnapshot = readLocalBoardState();
  const initialState  = localSnapshot || defaultBoardState();

  const [tables,    setTables]    = useState(initialState.tables);
  const [dishes,    setDishes]    = useState(initialState.dishes);
  const [wines,     setWines]     = useState(initialState.wines);
  const [cocktails, setCocktails] = useState(initialState.cocktails ?? initCocktails);
  const [spirits,   setSpirits]   = useState(initialState.spirits   ?? initSpirits);
  const [beers,     setBeers]     = useState(initialState.beers     ?? initBeers);
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("milka_mode") || null; } catch { return null; }
  });
  const [sel,          setSel]          = useState(null);
  const [resModal,     setResModal]     = useState(null);
  const [adminOpen,    setAdminOpen]    = useState(false);
  const [summaryOpen,  setSummaryOpen]  = useState(false);
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  const [syncStatus,   setSyncStatus]   = useState(hasSupabaseConfig ? "connecting" : "local-only");
  // Access gate: checked once at init against 12h TTL
  const [authed,       setAuthed]       = useState(() => readAccess());
  // Hydration gate: holds render until Supabase initial fetch resolves (or 4s timeout)
  const [hydrated,     setHydrated]     = useState(!hasSupabaseConfig);

  const applyingRemoteRef  = useRef(false);
  const lastRemoteJsonRef  = useRef("");
  const saveTimerRef       = useRef(null);

  const boardState = { tables, dishes, wines, cocktails, spirits, beers };
  const boardJson  = JSON.stringify(boardState);
  const boardStateRef = useRef(boardState);
  boardStateRef.current = boardState;

  const applyBoardState = payload => {
    if (!payload || typeof payload !== "object") return;
    applyingRemoteRef.current = true;
    lastRemoteJsonRef.current = JSON.stringify(payload);
    setTables(Array.isArray(payload.tables) ? payload.tables.map(sanitizeTable) : initTables);
    setDishes(Array.isArray(payload.dishes)    ? payload.dishes    : initDishes);
    setWines(Array.isArray(payload.wines)      ? payload.wines     : initWines);
    setCocktails(Array.isArray(payload.cocktails) ? payload.cocktails : initCocktails);
    setSpirits(Array.isArray(payload.spirits)  ? payload.spirits   : initSpirits);
    setBeers(Array.isArray(payload.beers)      ? payload.beers     : initBeers);
    setTimeout(() => { applyingRemoteRef.current = false; }, 0);
  };

  const selTable   = tables.find(t => t.id === sel);
  const modalTable = tables.find(t => t.id === resModal);

  const upd = (id, f, v) => setTables(p => p.map(t => t.id === id ? { ...t, [f]: v } : t));

  const updSeat = (tid, sid, f, v) => setTables(p => p.map(t =>
    t.id !== tid ? t : { ...t, seats: t.seats.map(s => s.id === sid ? { ...s, [f]: v } : s) }
  ));

  const setGuests = (tid, n) => setTables(p => p.map(t =>
    t.id !== tid ? t : { ...t, guests: n, seats: makeSeats(n, t.seats) }
  ));

  const seatTable = id => {
    const now = fmt(new Date());
    setTables(p => p.map(t =>
      t.id !== id ? t : { ...t, active: true, arrivedAt: now, seats: makeSeats(t.guests, t.seats) }
    ));
  };

  const unseatTable = id => {
    setTables(p => p.map(t =>
      t.id !== id ? t : { ...t, active: false, arrivedAt: null }
    ));
  };

  const clear = id => {
    if (typeof window !== "undefined" && !window.confirm("Clear this table and reset its details?")) return;
    setTables(p => p.map(t => t.id !== id ? t : blankTable(id)));
    setSel(null);
  };

  const clearAll = () => {
    if (typeof window !== "undefined" && !window.confirm("Clear ALL tables?")) return;
    setTables(Array.from({ length: 10 }, (_, i) => blankTable(i + 1)));
    setSel(null);
    setArchiveOpen(false);
  };

  const archiveAndClearAll = async () => {
    if (typeof window !== "undefined" && !window.confirm("Archive today's service and clear all tables?")) return;
    const snap = boardStateRef.current; // stable reference, never stale
    const dateStr = new Date().toLocaleDateString("sl-SI", { day: "2-digit", month: "2-digit", year: "numeric" });
    const activeTables = snap.tables.filter(t => t.active || t.arrivedAt || t.resName || t.resTime);
    if (supabase) {
      const { error } = await supabase.from("service_archive").insert({
        date: new Date().toISOString().slice(0, 10),
        label: dateStr,
        state: { ...snap, tables: activeTables },
      });
      if (error) {
        window.alert("Archive failed: " + error.message);
        return;
      }
    }
    setTables(Array.from({ length: 10 }, (_, i) => blankTable(i + 1)));
    setSel(null);
    setArchiveOpen(false);
  };

  const swapSeats = (tid, aId, bId) => setTables(p => p.map(t => {
    if (t.id !== tid) return t;
    const sA = t.seats.find(s => s.id === aId);
    const sB = t.seats.find(s => s.id === bId);
    return { ...t, seats: t.seats.map(s => {
      if (s.id === aId) return { ...sB, id: aId };
      if (s.id === bId) return { ...sA, id: bId };
      return s;
    })};
  }));

  const saveRes = (id, { name, time, menuType, guests, guestType, room, birthday, restrictions, notes }) => {
    setTables(p => p.map(t =>
      t.id !== id ? t : { ...t, resName: name, resTime: time, menuType, guestType, room, guests, seats: makeSeats(guests, t.seats), birthday, restrictions, notes }
    ));
    setResModal(null);
  };

  const changeMode = nextMode => {
    setMode(nextMode);
    try {
      if (nextMode) localStorage.setItem("milka_mode", nextMode);
      else          localStorage.removeItem("milka_mode");
    } catch {}
  };

  const switchMode = () => { changeMode(null); setSel(null); };

  // ── Persist + sync to Supabase ────────────────────────────────────────────
  useEffect(() => {
    // Don't write anything until we've loaded remote state — avoids stomping Supabase
    // with a stale localStorage snapshot before the initial fetch resolves.
    if (!hydrated) return;

    writeLocalBoardState(boardStateRef.current);

    if (applyingRemoteRef.current) return;
    if (!supabase) return;

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase.from("board_state").upsert({
        id: "main",
        state: boardStateRef.current,
        updated_at: new Date().toISOString(),
      });
      setSyncStatus(error ? "sync-error" : "live");
    }, 400);

    return () => clearTimeout(saveTimerRef.current);
  }, [boardJson, hydrated]);

  // ── Load from Supabase + subscribe realtime ───────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    // Fallback: open gate after 4s even if Supabase is slow/unreachable
    const gateTimeout = setTimeout(() => { if (isMounted) setHydrated(true); }, 4000);

    const loadRemote = async () => {
      const { data, error } = await supabase
        .from("board_state")
        .select("state, updated_at")
        .eq("id", "main")
        .maybeSingle();

      if (!isMounted) return;
      clearTimeout(gateTimeout);

      if (error) { setSyncStatus("sync-error"); setHydrated(true); return; }

      if (data?.state && Object.keys(data.state).length > 0) {
        applyBoardState(data.state);
        setSyncStatus("live");
      } else {
        // No remote state yet — just mark live, don't seed
        setSyncStatus("live");
      }
      setHydrated(true);
    };

    loadRemote();

    const channel = supabase
      .channel("milka-board-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "board_state", filter: "id=eq.main" }, payload => {
        const nextState = payload.new?.state;
        if (!nextState) return;
        const nextJson = JSON.stringify(nextState);
        if (nextJson === lastRemoteJsonRef.current) return;
        lastRemoteJsonRef.current = nextJson;
        applyBoardState(nextState);
        setSyncStatus("live");
      })
      .subscribe(status => {
        if (status === "SUBSCRIBED") setSyncStatus("live");
      });

    return () => {
      isMounted = false;
      clearTimeout(gateTimeout);
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load wines from Supabase `wines` table (auto-synced by cron) ─────────
  // Falls back to the hardcoded initWines if the table doesn't exist yet
  // or Supabase isn't configured. Wines are kept separate from boardState
  // so 700+ entries don't bloat every realtime sync.
  useEffect(() => {
    if (!supabase) return; // no Supabase config → keep initWines from state
    let isMounted = true;
    const fetchWines = async () => {
      const { data, error } = await supabase
        .from("wines")
        .select("id, name, wine_name, producer, vintage, region, country, by_glass")
        .order("country")
        .order("name");
      if (!isMounted || error || !data?.length) return;
      // Map Supabase snake_case → camelCase expected by the app
      const mapped = data.map(w => ({
        id:       w.id,
        name:     w.name,
        producer: w.producer,
        vintage:  w.vintage,
        region:   w.region,
        byGlass:  w.by_glass,
      }));
      setWines(mapped);
    };
    fetchWines();

    // Also subscribe to realtime on the wines table so the app updates
    // live when the nightly cron finishes (or if you manually trigger it)
    const wineChannel = supabase
      .channel("milka-wines-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "wines" }, () => {
        fetchWines();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(wineChannel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active   = tables.filter(t => t.active);
  const seated   = active.reduce((a, t) => a + t.guests, 0);
  const reserved = tables.filter(t => !t.active && (t.resName || t.resTime)).length;

  const syncLabel = syncStatus === "live" ? "SYNC" : syncStatus === "local-only" ? "LOCAL" : syncStatus === "connecting" ? "LINK" : "ERROR";
  const syncLive  = syncStatus === "live";

  const hProps = {
    syncLabel, syncLive,
    activeCount: active.length, reserved, seated,
    onExit: switchMode,
    onMenu: () => setAdminOpen(true),
    onSummary: () => setSummaryOpen(true),
    onArchive: () => setArchiveOpen(true),
  };

  // Gate 1: password wall — must authenticate before anything
  if (!authed) return <GateScreen onPass={() => setAuthed(true)} />;

  // Gate 2: hydration — wait for Supabase state before rendering
  if (!hydrated) return (
    <div style={{
      minHeight: "100vh", background: "#fff", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: FONT, gap: 24,
    }}>
      <GlobalStyle />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 6, color: "#1a1a1a", marginBottom: 6 }}>MILKA</div>
        <div style={{ fontSize: 9, letterSpacing: 4, color: "#bbb" }}>CONNECTING…</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: "50%", background: "#e0e0e0",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{opacity:0.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );

  if (!mode) return <LoginScreen onEnter={m => { changeMode(m); setSel(null); }} />;

  // Display mode
  if (mode === "display") return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, overflowX: "hidden", WebkitTextSizeAdjust: "100%" }}>
      <GlobalStyle />
      <Header modeLabel="DISPLAY" showSummary={false} showMenu={false} showArchive={false} {...hProps} />
      <DisplayBoard tables={tables} dishes={dishes} />
    </div>
  );

  // Service + Admin modes
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, overflowX: "hidden", WebkitTextSizeAdjust: "100%" }}>
      <GlobalStyle />

      <Header
        modeLabel={mode === "admin" ? "ADMIN" : "SERVICE"}
        showSummary={true}
        showMenu={mode === "admin"}
        showArchive={mode === "admin"}
        {...hProps}
      />

      {sel === null ? (
        <div style={{ padding: "20px 12px", maxWidth: 960, margin: "0 auto", overflowX: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {tables.map(t => (
              <Card key={t.id} table={t}
                mode={mode}
                onClick={() => t.active && setSel(t.id)}
                onSeat={() => seatTable(t.id)}
                onUnseat={() => unseatTable(t.id)}
                onClear={() => clear(t.id)}
                onEditRes={() => mode === "admin" && setResModal(t.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <Detail
          table={selTable}
          dishes={dishes}
          wines={wines}
          cocktails={cocktails}
          spirits={spirits}
          beers={beers}
          mode={mode}
          onBack={() => setSel(null)}
          upd={(f, v) => upd(sel, f, v)}
          updSeat={(sid, f, v) => updSeat(sel, sid, f, v)}
          setGuests={n => setGuests(sel, n)}
          swapSeats={(aId, bId) => swapSeats(sel, aId, bId)}
        />
      )}

      {mode === "admin" && resModal !== null && modalTable && (
        <ReservationModal table={modalTable} onSave={data => saveRes(resModal, data)} onClose={() => setResModal(null)} />
      )}
      {adminOpen && (
        <AdminPanel
          dishes={dishes} wines={wines} cocktails={cocktails} spirits={spirits} beers={beers}
          onUpdateDishes={setDishes} onUpdateWines={setWines}
          onUpdateCocktails={setCocktails} onUpdateSpirits={setSpirits} onUpdateBeers={setBeers}
          onClose={() => setAdminOpen(false)}
        />
      )}
      {summaryOpen && (
        <SummaryModal tables={tables} dishes={dishes} onClose={() => setSummaryOpen(false)} />
      )}
      {archiveOpen && (
        <ArchiveModal
          tables={tables} dishes={dishes}
          onArchiveAndClear={archiveAndClearAll}
          onClearAll={clearAll}
          onClose={() => setArchiveOpen(false)}
        />
      )}
    </div>
  );
}
