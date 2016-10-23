var $ = window.jQuery;

const canvasWidth = 300;
const canvasHeight = 250;
const gap = 2;
const bottomMargin = gap * 2;
const borderWidth = 0.5;


const bars = [{
	key: 'adult_male_rmng_cap',
	label: 'Men',
	color: '#BFE7F5'
}, {
	key: 'adult_fmale_rmng_cap',
	label: 'Women',
	color: '#F2D8EC'
}, {
	key: 'children_rmng_cap',
	label: 'Children',
	color: '#F2F2D8'
}, {
	key: 'abused_rmng_cap',
	label: 'Abuse Victims',
	color: '#D8F2E5'
}];

bars.forEach(bar => {
	var container = $('<div>').appendTo('#legend');
	$('<div>').addClass('swatch').css({'background-color': bar.color}).appendTo(container);
	container.append(bar.label);
});

// var rows = JSON.parse('[{"abused_rmng_cap":0,"address":"12th & Park","adult_fmale_rmng_cap":0,"adult_male_rmng_cap":106,"agency_name":"12th & Park Shelter","children_rmng_cap":0,"county":"Saint Louis City"},{"abused_rmng_cap":0,"address":"1000 N 19th St.","adult_fmale_rmng_cap":0,"adult_male_rmng_cap":173,"agency_name":"Gateway 180","children_rmng_cap":0,"county":"Saint Louis City"},{"abused_rmng_cap":29,"address":"2750 McKelvey Rd","adult_fmale_rmng_cap":0,"adult_male_rmng_cap":0,"agency_name":"Loaves & Fishes Inc.","children_rmng_cap":0,"county":"Saint Louis County"},{"abused_rmng_cap":0,"address":"3415 Bridgeland Dr","adult_fmale_rmng_cap":0,"adult_male_rmng_cap":20,"agency_name":"Room at The Inn","children_rmng_cap":0,"county":"Saint Louis County"},{"abused_rmng_cap":0,"address":"4223 South Compton Ave","adult_fmale_rmng_cap":0,"adult_male_rmng_cap":18,"agency_name":"Our Lady\'s Inn","children_rmng_cap":0,"county":"Saint Louis City"},{"abused_rmng_cap":0,"address":"1919 South 7th St","adult_fmale_rmng_cap":30,"adult_male_rmng_cap":30,"agency_name":"Peter & Paul","children_rmng_cap":0,"county":"Saint Louis City"},{"abused_rmng_cap":0,"address":"10740 Page Ave","adult_fmale_rmng_cap":20,"adult_male_rmng_cap":20,"agency_name":"Salvation Army Family Haven","children_rmng_cap":24,"county":"Saint Louis County"},{"abused_rmng_cap":0,"address":"1447 East Grand Ave","adult_fmale_rmng_cap":0,"adult_male_rmng_cap":89,"agency_name":"Humanitri","children_rmng_cap":0,"county":"Saint Louis City"},{"abused_rmng_cap":0,"address":"800 North Tucker Blvd.","adult_fmale_rmng_cap":20,"adult_male_rmng_cap":0,"agency_name":"Saint Patrick Center- Women\'s Night","children_rmng_cap":0,"county":"Saint Louis City"}]');

var render = rows => {

	rows.forEach(row => {
		Object.keys(row).forEach(key => {
			if (!isNaN(row[key])) row[key] = parseFloat(row[key]);
		});
	});

	$('#stuffGoesHere').empty();

	rows.forEach(row => {

		var container = $('<div>').addClass('chartContainer col-md-4').appendTo('#stuffGoesHere');

		var canvas = document.createElement('canvas');
		container.append(canvas);

		$('<h3>').text(row.agency_name).appendTo(container);

		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		var T = canvas.getContext('2d');

		T.fillRect(0, canvasHeight, canvasWidth, -gap * 2);
		T.fillRect(0, 0, gap * 2, canvasHeight);

		var xScale = (canvasWidth - bottomMargin) / bars.length;
		bars.forEach((bar, i) => {

			var val = row[bar.key];

			T.fillStyle = 'black';
			T.fillRect(i * xScale + gap + bottomMargin, canvasHeight - bottomMargin - gap, xScale - 2 * gap, -val);

			if (val - 2 * borderWidth > 0){
				T.fillStyle = bar.color;
				T.fillRect(i * xScale + borderWidth + gap + bottomMargin, canvasHeight - bottomMargin - borderWidth - gap, xScale - 2 * borderWidth - 2 * gap, -val + 2 * borderWidth);
			}

			T.fillStyle = 'black';
			T.textAlign = 'center';
			T.font = '14px sans-serif';
			T.fillText(val, (i + 0.5) * xScale, canvasHeight - val - 10);

		});

	});

};

var loop = () => {
	$.ajax({
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		url: 'http://f364295e.ngrok.io/select',
		data: JSON.stringify({SQL: 'SELECT agency_name, address, county, abused_rmng_cap, adult_fmale_rmng_cap, adult_male_rmng_cap, children_rmng_cap FROM availability'})
	}, 'json').then(data => {
		render(data.data);
		setTimeout(loop, 10000);
	});
};

loop();
