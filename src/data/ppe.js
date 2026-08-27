// PPE groups from FR-HSE-38. Item text is verbatim from the printed form.
// Eye and Head protection carry a single unnamed tick box on the paper form,
// so they get one item labelled "Required".
import { FaMaskFace, FaHeadSideMask, FaHelmetSafety, FaHeadphonesSimple } from 'react-icons/fa6'
import { GiGloves, GiProtectionGlasses, GiMetalBoot, GiLabCoat } from 'react-icons/gi'

export const PPE_GROUPS = [
  {
    key: 'hand',
    title: 'Hand Protection',
    Icon: GiGloves,
    items: [
      { key: 'leather_gloves',       label: 'Leather gloves' },
      { key: 'cotton_gloves',        label: 'Cotton gloves' },
      { key: 'nitrile_gloves',       label: 'Nitrile gloves' },
      { key: 'cut_resistance_gloves', label: 'Cut resistance gloves' },
      { key: 'leather_hand_sleeves', label: 'Leather Hand sleeves' },
    ],
  },
  {
    key: 'respirator',
    title: 'Respirator Protection',
    Icon: FaMaskFace,
    items: [
      { key: 'surgical_mask',      label: 'Surgical mask' },
      { key: 'ffp2',               label: 'FFP2' },
      { key: 'half_face_respirator', label: 'Half face respirator' },
      { key: 'respirator_other',   label: 'Other', other: true },
    ],
  },
  {
    key: 'eye',
    title: 'Eye Protection',
    Icon: GiProtectionGlasses,
    items: [{ key: 'eye_protection', label: 'Required' }],
  },
  {
    key: 'face',
    title: 'Face Protection',
    Icon: FaHeadSideMask,
    items: [
      { key: 'pvc_face_shield', label: 'PVC Face shield' },
      { key: 'welding_shield',  label: 'Welding Shield' },
    ],
  },
  {
    key: 'foot',
    title: 'Foot protection',
    Icon: GiMetalBoot,
    items: [
      { key: 'metal_toe_shoe',     label: 'Metal Toe Shoe' },
      { key: 'fiber_toe_shoe',     label: 'Fiber Toe Shoe' },
      { key: 'gumboots',           label: 'Gumboots' },
      { key: 'leather_leg_sleeves', label: 'Leather Leg sleeves' },
    ],
  },
  {
    key: 'head',
    title: 'Head Protection',
    Icon: FaHelmetSafety,
    items: [{ key: 'head_protection', label: 'Required' }],
  },
  {
    key: 'ear',
    title: 'Ear protection',
    Icon: FaHeadphonesSimple,
    items: [
      { key: 'ear_plug', label: 'Ear Plug' },
      { key: 'ear_muff', label: 'Ear muff' },
    ],
  },
  {
    key: 'body',
    title: 'Body Protection',
    Icon: GiLabCoat,
    items: [
      { key: 'cover_all',        label: 'Cover all' },
      { key: 'leather_apron',    label: 'Leather Apron' },
      { key: 'pvc_apron',        label: 'PVC Apron' },
      { key: 'reflective_jacket', label: 'Reflective Jacket' },
    ],
  },
]

export const PPE_LABEL = Object.fromEntries(
  PPE_GROUPS.flatMap((g) => g.items.map((i) => [i.key, `${g.title}: ${i.label}`]))
)
