// The ten work-permit categories from FR-HSE-38, in printed order.
// Pictograms are chosen to read at 18px on a shop-floor laptop.
import {
  FaFireFlameCurved,
  FaTruckDroplet,
  FaScrewdriverWrench,
  FaCalendarDay,
} from 'react-icons/fa6'
import { GiLadder, GiCrane, GiPadlock, GiBulldozer, GiCaveEntrance } from 'react-icons/gi'
import { MdElectricBolt } from 'react-icons/md'

export const WORK_PERMITS = [
  { key: 'height_work',       label: 'Height Work',                Icon: GiLadder },
  { key: 'hot_work',          label: 'Hot Work',                   Icon: FaFireFlameCurved },
  { key: 'lifting_shifting',  label: 'Lifting/Shifting heavy equipment/machinery/material', Icon: GiCrane },
  { key: 'electrical_work',   label: 'Electrical Work',            Icon: MdElectricBolt },
  { key: 'energy_isolation',  label: 'Energy Isolation',           Icon: GiPadlock },
  { key: 'excavation_work',   label: 'Excavation work',            Icon: GiBulldozer },
  { key: 'tanker_unloading',  label: 'Unloading tanker containing flammable liquid/gas to storage tank', Icon: FaTruckDroplet },
  { key: 'confined_space',    label: 'Confined space',             Icon: GiCaveEntrance },
  { key: 'general_work',      label: 'General Work',               Icon: FaScrewdriverWrench },
  { key: 'sunday_holiday',    label: 'Sunday / Holiday Work',      Icon: FaCalendarDay },
]
