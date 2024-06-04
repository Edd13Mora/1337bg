import styled from 'styled-components';

interface StyledCardProps {
    gradientColor: string;
}

const hexToRGBA = (hex : string, alpha : number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const StyledCard = styled.div<StyledCardProps>`
    width : 400px;
    height: 200px;
    background-color : #303344;
    border-radius : 10px;
    transition : 0.4s ease-in-out;
    cursor: pointer;
    position : relative;
    overflow  : hidden;
    padding : 10px;
    border-bottom : 2px solid ${props => props.gradientColor};
    &:hover{
        border-bottom : 3px solid ${props => props.gradientColor};
        /* Use hexToRGBA function to convert hex to rgba with opacity */
        box-shadow: ${props => `${hexToRGBA(props.gradientColor, 0.3)} 0px 10px 15px -3px, ${hexToRGBA(props.gradientColor, 0.3)} 0px 4px 6px -2px`};
        .go_icon{
            color : ${props => props.gradientColor};
        }
    }

    h1{
        background-color : transparent;
        font-size : 1.5rem;
        color : ${props => props.gradientColor};
    }
    h5{
        position: relative;
        font-size : 0.9rem;
        background-color :transparent;
        font-weight : 400;
        color : white;
        z-index: 2;
    }
    .gradient_{
        position : absolute;
        width : 100%;
        height : 100%;
        background-color :transparent;
        bottom : -15%;
        left : -10%;
        z-index: 1;
    }
    .go_icon{
        position : absolute;
        background-color : transparent;
        color : white;
        right : 20px;
        bottom : 20px;
    }
    ._service_icon{
        position : absolute;
        background-color :transparent ;
        height :90px;
        bottom : 15%;
        left : 10%;
        z-index : 9;
        height : 60px;
    }
`